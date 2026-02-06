"use client";

import { HoldingComputed } from "@/types/portfolio";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopHoldingsChartProps {
  holdings: HoldingComputed[];
  maxBars?: number;
}

export default function TopHoldingsChart({
  holdings,
  maxBars = 10,
}: TopHoldingsChartProps) {
  const withValue = holdings.filter(
    (h) => h.presentValue !== null && h.presentValue > 0
  );
  const sorted = [...withValue]
    .sort((a, b) => (b.presentValue ?? 0) - (a.presentValue ?? 0))
    .slice(0, maxBars);

  if (sorted.length === 0) return null;

  const data = sorted.map((h) => ({
    symbol: h.symbol,
    value: h.presentValue ?? 0,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top Holdings by Value</h2>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v / 1e5).toFixed(1)}L`}
              stroke="#6b7280"
            />
            <YAxis
              type="category"
              dataKey="symbol"
              width={50}
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Value"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
