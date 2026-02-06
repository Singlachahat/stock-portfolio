import { Request, Response } from "express";
import { refreshMarketCache, getSymbolsByPortfolioId, getQuoteForSymbol } from "../services/market.service";

export async function getQuote(req: Request, res: Response) {
  try {
    const symbol = typeof req.query.symbol === "string" ? req.query.symbol.trim() : "";
    if (!symbol) {
      return res.status(400).json({ error: "Query parameter 'symbol' is required" });
    }
    const quote = await getQuoteForSymbol(symbol);
    if (quote.error) {
      return res.status(404).json({ error: quote.error, cmp: null });
    }
    return res.json(quote);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch quote" });
  }
}

export async function refreshMarket(req: Request, res: Response) {
  try {
    const { symbols, portfolioId } = req.body as { symbols?: string[]; portfolioId?: string };

    let symbolsToRefresh: string[] = [];

    if (portfolioId) {
      symbolsToRefresh = await getSymbolsByPortfolioId(portfolioId);
      if (symbolsToRefresh.length === 0) {
        return res.json({ message: "No holdings in portfolio", updated: 0, errors: [] });
      }
    } else if (symbols && Array.isArray(symbols) && symbols.length > 0) {
      symbolsToRefresh = symbols.map((s) => String(s).trim().toUpperCase());
    } else {
      return res.status(400).json({
        error: "Provide either 'symbols' (array) or 'portfolioId' in request body",
      });
    }

    const result = await refreshMarketCache(symbolsToRefresh);

    return res.json({
      message: `Refreshed ${result.updated} symbol(s)`,
      updated: result.updated,
      errors: result.errors,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to refresh market data" });
  }
}
