import YahooFinance from "yahoo-finance2";
import { prisma } from "../lib/prisma";
import { fetchGoogleFinanceQuote } from "./google-finance.service";

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
    const cmp = yahooQuote.cmp;

    if (yahooQuote.error) {
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
  return fetchYahooQuote(String(symbol).trim().toUpperCase());
}

export async function getSymbolsByPortfolioId(portfolioId: string): Promise<string[]> {
  const holdings = await prisma.holding.findMany({
    where: { portfolioId },
    include: { stock: { select: { symbol: true } } },
  });
  return holdings.map((h) => h.stock.symbol);
}
