import YahooFinance from "yahoo-finance2";
import { prisma } from "../lib/prisma";
import { fetchGoogleFinanceQuote } from "./google-finance.service";
import { getYahooViaRapid } from "./rapidapi.service";

export interface MarketQuote {
  symbol: string;
  cmp: number;
  peRatio: number | null;
  latestEarning: string | null;
  error?: string;
}

export async function fetchYahooQuote(symbol: string): Promise<MarketQuote> {
  try {
    const yahooFinance = new YahooFinance();
    const quote = await yahooFinance.quote(symbol);

    const cmp = quote.regularMarketPrice ?? 0;
    const peRatio = quote.trailingPE ?? null;

    let latestEarning: string | null = null;
    if (quote.earningsTimestamp) {
      const d = new Date(quote.earningsTimestamp);
      latestEarning = d.toISOString().slice(0, 10);
    } else if (quote.earningsTimestampStart) {
      const d = new Date(quote.earningsTimestampStart);
      latestEarning = d.toISOString().slice(0, 10);
    }

    return { symbol, cmp, peRatio, latestEarning };
  } catch (err: any) {
    return {
      symbol,
      cmp: 0,
      peRatio: null,
      latestEarning: null,
      error: err?.message ?? "Failed to fetch quote",
    };
  }
}

export async function refreshMarketCache(symbols: string[]): Promise<{ updated: number; errors: string[] }> {
  const uniqueSymbols = [...new Set(symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
  const errors: string[] = [];
  let updated = 0;

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const symbol of uniqueSymbols) {
    const stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) {
      errors.push(`Stock not found: ${symbol}`);
      await delay(100);
      continue;
    }

    const yahooQuote = await fetchYahooQuote(symbol);
    const googleQuote = await fetchGoogleFinanceQuote(symbol, stock.exchange);
    await delay(400);

    const peRatio = googleQuote.peRatio ?? yahooQuote.peRatio;
    const latestEarning = googleQuote.latestEarning ?? yahooQuote.latestEarning;
    let cmp = yahooQuote.cmp;

    if (yahooQuote.error && cmp === 0) {
      let rapid: { cmp: number; error?: string } = { cmp: 0 };
      try {
        rapid = await getYahooViaRapid(symbol);
      } catch (_) {
        rapid = { cmp: 0, error: "RapidAPI request failed" };
      }
      await delay(500);
      if (!rapid.error && rapid.cmp > 0) {
        cmp = rapid.cmp;
      } else {
        await prisma.marketCache.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            cmp: 0,
            peRatio: peRatio,
            latestEarning: latestEarning,
            lastError: yahooQuote.error,
          },
          update: {
            cmp: 0,
            peRatio: peRatio,
            latestEarning: latestEarning,
            lastError: yahooQuote.error,
          },
        });
        errors.push(`${symbol}: ${yahooQuote.error}`);
        await delay(300);
        continue;
      }
    }

    await prisma.marketCache.upsert({
      where: { stockId: stock.id },
      create: {
        stockId: stock.id,
        cmp,
        peRatio,
        latestEarning,
        lastError: null,
      },
      update: {
        cmp,
        peRatio,
        latestEarning,
        lastError: null,
      },
    });
    updated++;
    await delay(300);
  }

  return { updated, errors };
}

export async function getQuoteForSymbol(symbol: string): Promise<MarketQuote> {
  const normalized = String(symbol).trim().toUpperCase();
  const yahoo = await fetchYahooQuote(normalized);
  if (!yahoo.error && yahoo.cmp > 0) {
    return yahoo;
  }
  let rapid: { cmp: number; error?: string } = { cmp: 0 };
  try {
    rapid = await getYahooViaRapid(normalized);
  } catch (_) {
    rapid = { cmp: 0, error: "RapidAPI request failed" };
  }
  if (!rapid.error && rapid.cmp > 0) {
    return {
      symbol: normalized,
      cmp: rapid.cmp,
      peRatio: yahoo.peRatio ?? null,
      latestEarning: yahoo.latestEarning ?? null,
    };
  }
  return {
    symbol: normalized,
    cmp: 0,
    peRatio: null,
    latestEarning: null,
    error: yahoo.error ?? rapid.error ?? "Failed to fetch quote",
  };
}

export async function getSymbolsByPortfolioId(portfolioId: string): Promise<string[]> {
  const holdings = await prisma.holding.findMany({
    where: { portfolioId },
    include: { stock: { select: { symbol: true } } },
  });
  return holdings.map((h) => h.stock.symbol);
}
