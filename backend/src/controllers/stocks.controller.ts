import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import YahooFinance from "yahoo-finance2";

export async function listStocks(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const sector = typeof req.query.sector === "string" ? req.query.sector.trim() : "";

    const where: Prisma.StockWhereInput = {};

    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (sector) {
      where.sector = { contains: sector, mode: "insensitive" };
    }

    const stocks = await prisma.stock.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { cache: true },
      orderBy: { symbol: "asc" },
    });

    return res.json({ stocks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to list stocks" });
  }
}

export async function getStockBySymbol(req: Request, res: Response) {
  try {
    const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.trim().toUpperCase() },
      include: { cache: true },
    });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    return res.json(stock);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch stock" });
  }
}

export async function searchStocks(req: Request, res: Response) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const yahooFinance = new YahooFinance();
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    });

    const stocks = searchResults.quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange || quote.exchDisp || "UNKNOWN",
      type: quote.quoteType || quote.typeDisp || "EQUITY",
    }));

    return res.json({ stocks });
  } catch (err: any) {
    console.error("Stock search error:", err);
    return res.status(500).json({ 
      error: "Failed to search stocks",
      details: err.message 
    });
  }
}
