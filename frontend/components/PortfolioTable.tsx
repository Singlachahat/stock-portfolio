"use client";

import { HoldingComputed } from "@/types/portfolio";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getGainLossStyle,
  formatDate,
} from "@/lib/utils";

interface PortfolioTableProps {
  holdings: HoldingComputed[];
  onDelete?: (holdingId: string) => void;
}

export default function PortfolioTable({
  holdings,
  onDelete,
}: PortfolioTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">No holdings yet. Add your first stock!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Particulars
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Investment
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Portfolio %
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exchange
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                CMP
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Present Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gain/Loss
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                P/E Ratio
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Latest Earnings
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holdings.map((holding) => (
              <tr
                key={holding.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {holding.name}
                    </div>
                    <div className="text-xs text-gray-500">{holding.symbol}</div>
                    <div className="text-xs text-blue-600">{holding.sector}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatCurrency(holding.purchasePrice)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatNumber(holding.quantity, 0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {formatCurrency(holding.investment)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                  {formatNumber(holding.portfolioPercent, 2)}%
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {holding.exchange}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                  {holding.cmp !== null ? formatCurrency(holding.cmp) : "—"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {holding.presentValue !== null
                    ? formatCurrency(holding.presentValue)
                    : "—"}
                </td>
                <td
                  className="px-4 py-4 whitespace-nowrap text-right"
                  style={getGainLossStyle(holding.gainLoss)}
                >
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold">
                      {holding.gainLoss !== null
                        ? formatCurrency(holding.gainLoss)
                        : "—"}
                    </div>
                    {holding.gainLossPercent !== null && (
                      <div className="text-xs" style={getGainLossStyle(holding.gainLossPercent)}>
                        {formatPercent(holding.gainLossPercent)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                  {holding.peRatio !== null ? formatNumber(holding.peRatio, 2) : "—"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                  {formatDate(holding.latestEarning)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                  <div className="flex items-center justify-center gap-2">
                    {onDelete && (
                      <button
                        onClick={() => onDelete(holding.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                        title="Delete"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
