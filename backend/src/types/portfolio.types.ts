export interface HoldingComputed {
  id: string;
  stockId: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  quantity: number;
  purchasePrice: number;
  investment: number;
  portfolioPercent: number;
  cmp: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  peRatio: number | null;
  latestEarning: string | null;
  cacheUpdatedAt: string | null;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingCount: number;
}

export interface PortfolioWithComputed {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: HoldingComputed[];
  sectorSummary: SectorSummary[];
}
