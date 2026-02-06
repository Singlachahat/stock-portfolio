"use client";

import { PortfolioWithComputed } from "@/types/portfolio";
import {
  formatCurrency,
  formatPercent,
  getGainLossStyle,
  formatTimeAgo,
} from "@/lib/utils";

interface PortfolioSummaryProps {
  portfolio: PortfolioWithComputed;
  lastUpdated: string | null;
  isRefreshing: boolean;
}

export default function PortfolioSummary({
  portfolio,
  lastUpdated,
  isRefreshing,
}: PortfolioSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{portfolio.name}</h1>
        <div className="text-right text-sm">
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            <span className="opacity-90">
              Updated: {formatTimeAgo(lastUpdated)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <div className="text-sm opacity-90 mb-1">Total Investment</div>
          <div className="text-2xl font-bold">
            {formatCurrency(portfolio.totalInvestment)}
          </div>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <div className="text-sm opacity-90 mb-1">Present Value</div>
          <div className="text-2xl font-bold">
            {formatCurrency(portfolio.totalPresentValue)}
          </div>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <div className="text-sm opacity-90 mb-1">Total Gain/Loss</div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold" style={getGainLossStyle(portfolio.totalGainLoss)}>
              {formatCurrency(portfolio.totalGainLoss)}
            </div>
            <div className="text-sm" style={getGainLossStyle(portfolio.totalGainLossPercent)}>
              {formatPercent(portfolio.totalGainLossPercent)}
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <div className="text-sm opacity-90 mb-1">Holdings</div>
          <div className="text-2xl font-bold">{portfolio.holdings.length}</div>
          <div className="text-xs opacity-75 mt-1">
            {portfolio.sectorSummary.length} sectors
          </div>
        </div>
      </div>
    </div>
  );
}
