import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { HoldingComputed, SectorSummary } from "../types/portfolio.types";

export function computePortfolio(holdings: Array<{
  id: string;
  quantity: number;
  purchasePrice: number;
  stockId: string;
  stock: { symbol: string; name: string; sector: string; exchange: string; cache: { cmp: number; peRatio: number | null; latestEarning: string | null; updatedAt: Date } | null };
}>): { holdings: HoldingComputed[]; sectorSummary: SectorSummary[]; totalInvestment: number; totalPresentValue: number; totalGainLoss: number; totalGainLossPercent: number } {
  const totalInvestment = holdings.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0);

  const holdingsComputed: HoldingComputed[] = holdings.map((h) => {
    const investment = h.purchasePrice * h.quantity;
    const cmp = h.stock.cache?.cmp ?? null;
    const presentValue = cmp !== null ? cmp * h.quantity : null;
    const gainLoss = presentValue !== null ? presentValue - investment : null;
    const gainLossPercent = investment > 0 && gainLoss !== null ? (gainLoss / investment) * 100 : null;
    const portfolioPercent = totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0;

    return {
      id: h.id,
      stockId: h.stockId,
      symbol: h.stock.symbol,
      name: h.stock.name,
      sector: h.stock.sector,
      exchange: h.stock.exchange,
      quantity: h.quantity,
      purchasePrice: h.purchasePrice,
      investment,
      portfolioPercent,
      cmp,
      presentValue,
      gainLoss,
      gainLossPercent,
      peRatio: h.stock.cache?.peRatio ?? null,
      latestEarning: h.stock.cache?.latestEarning ?? null,
      cacheUpdatedAt: h.stock.cache?.updatedAt ? h.stock.cache.updatedAt.toISOString() : null,
    };
  });

  const totalPresentValue = holdingsComputed.reduce((sum, h) => sum + (h.presentValue ?? 0), 0);
  const totalGainLoss = totalPresentValue - totalInvestment;
  const totalGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  const sectorMap = new Map<string, { investment: number; presentValue: number; count: number }>();
  for (const h of holdingsComputed) {
    const cur = sectorMap.get(h.sector) ?? { investment: 0, presentValue: 0, count: 0 };
    cur.investment += h.investment;
    cur.presentValue += h.presentValue ?? 0;
    cur.count += 1;
    sectorMap.set(h.sector, cur);
  }

  const sectorSummary: SectorSummary[] = Array.from(sectorMap.entries()).map(([sector, data]) => ({
    sector,
    totalInvestment: data.investment,
    totalPresentValue: data.presentValue,
    totalGainLoss: data.presentValue - data.investment,
    totalGainLossPercent: data.investment > 0 ? ((data.presentValue - data.investment) / data.investment) * 100 : 0,
    holdingCount: data.count,
  }));

  return {
    holdings: holdingsComputed,
    sectorSummary,
    totalInvestment,
    totalPresentValue,
    totalGainLoss,
    totalGainLossPercent,
  };
}

export async function getMyPortfolio(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: {
        holdings: {
          include: {
            stock: {
              include: { cache: true },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    type PortfolioWithHoldings = typeof portfolio & {
      holdings: Array<{ id: string; quantity: number; purchasePrice: number; stockId: string; stock: { symbol: string; name: string; sector: string; exchange: string; cache: { cmp: number; peRatio: number | null; latestEarning: string | null; updatedAt: Date } | null } }>;
    };
    const { holdings, sectorSummary, totalInvestment, totalPresentValue, totalGainLoss, totalGainLossPercent } =
      computePortfolio((portfolio as PortfolioWithHoldings).holdings);

    return res.json({
      id: portfolio.id,
      name: portfolio.name,
      userId: portfolio.userId,
      createdAt: portfolio.createdAt.toISOString(),
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercent,
      holdings,
      sectorSummary,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch portfolio" });
  }
}

export async function updatePortfolio(req: Request, res: Response) {
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

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    const updated = await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { name },
    });

    return res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to update portfolio" });
  }
}
