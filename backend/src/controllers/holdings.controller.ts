import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { computePortfolio } from "./portfolio.controller";

export async function getHoldings(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const portfolioWithHoldings = await prisma.portfolio.findUnique({
      where: { id: portfolio.id },
      include: {
        holdings: {
          include: {
            stock: { include: { cache: true } },
          },
        },
      },
    });

    if (!portfolioWithHoldings) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const holdingsList = (portfolioWithHoldings as { holdings: Parameters<typeof computePortfolio>[0] }).holdings;
    const { holdings } = computePortfolio(holdingsList);
    return res.json({ portfolioId: portfolio.id, holdings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch holdings" });
  }
}

export async function addHolding(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    const portfolioId = portfolio.id;

    const { symbol, quantity, purchasePrice, name, sector, exchange } = req.body;

    if (!symbol || quantity == null || purchasePrice == null) {
      return res.status(400).json({ error: "symbol, quantity, and purchasePrice are required" });
    }

    const qty = Number(quantity);
    const price = Number(purchasePrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      return res.status(400).json({ error: "quantity must be positive; purchasePrice must be non-negative" });
    }

    const symbolNorm = String(symbol).trim().toUpperCase();
    const stock = await prisma.stock.upsert({
      where: { symbol: symbolNorm },
      create: {
        symbol: symbolNorm,
        name: name?.trim() || symbolNorm,
        sector: sector?.trim() || "Unknown",
        exchange: exchange?.trim() || "NSE",
      },
      update: {},
    });

    const existing = await prisma.holding.findUnique({
      where: {
        portfolioId_stockId: { portfolioId, stockId: stock.id },
      },
    });

    let holding;
    if (existing) {
      const newQuantity = existing.quantity + qty;
      const totalCost = existing.quantity * existing.purchasePrice + qty * price;
      const avgPurchasePrice = totalCost / newQuantity;

      holding = await prisma.holding.update({
        where: {
          portfolioId_stockId: { portfolioId, stockId: stock.id },
        },
        data: {
          quantity: newQuantity,
          purchasePrice: avgPurchasePrice,
        },
        include: {
          stock: { include: { cache: true } },
        },
      });
    } else {
      holding = await prisma.holding.create({
        data: {
          portfolioId,
          stockId: stock.id,
          quantity: qty,
          purchasePrice: price,
        },
        include: {
          stock: { include: { cache: true } },
        },
      });
    }

    return res.status(201).json(holding);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Holding already exists" });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to add holding" });
  }
}

export async function updateHolding(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    const portfolioId = portfolio.id;

    const holdingId = String(req.params.holdingId ?? "");
    const { quantity, purchasePrice } = req.body;

    const data: { quantity?: number; purchasePrice?: number } = {};
    if (quantity != null) {
      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: "quantity must be a positive number" });
      }
      data.quantity = qty;
    }
    if (purchasePrice != null) {
      const price = Number(purchasePrice);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "purchasePrice must be a non-negative number" });
      }
      data.purchasePrice = price;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Provide quantity and/or purchasePrice to update" });
    }

    const holding = await prisma.holding.findFirst({
      where: { id: holdingId, portfolioId },
    });

    if (!holding) {
      return res.status(404).json({ error: "Holding not found" });
    }

    const updated = await prisma.holding.update({
      where: { id: holdingId },
      data,
      include: {
        stock: { include: { cache: true } },
      },
    });

    return res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Holding not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to update holding" });
  }
}

export async function deleteHolding(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    const portfolioId = portfolio.id;

    const holdingId = String(req.params.holdingId ?? "");

    const holding = await prisma.holding.findFirst({
      where: { id: holdingId, portfolioId },
    });

    if (!holding) {
      return res.status(404).json({ error: "Holding not found" });
    }

    await prisma.holding.delete({ where: { id: holdingId } });
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Holding not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to delete holding" });
  }
}
