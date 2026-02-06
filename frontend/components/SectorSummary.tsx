"use client";

import { SectorSummary as SectorSummaryType } from "@/types/portfolio";
import {
  formatCurrency,
  formatPercent,
  getGainLossStyle,
} from "@/lib/utils";

interface SectorSummaryProps {
  sectors: SectorSummaryType[];
}

export default function SectorSummary({ sectors }: SectorSummaryProps) {
  if (sectors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Sector Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sector) => (
          <div key={sector.sector}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{sector.sector}</h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {sector.holdingCount} {sector.holdingCount === 1 ? "stock" : "stocks"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Investment:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(sector.totalInvestment)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Present Value:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(sector.totalPresentValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-900">Gain/Loss:</span>
                <div className="text-right">
                  <div className="font-bold" style={getGainLossStyle(sector.totalGainLoss)}>
                    {formatCurrency(sector.totalGainLoss)}
                  </div>
                  <div className="text-xs" style={getGainLossStyle(sector.totalGainLossPercent)}>
                    {formatPercent(sector.totalGainLossPercent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
