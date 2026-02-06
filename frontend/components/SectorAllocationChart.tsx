"use client";

import { SectorSummary as SectorSummaryType } from "@/types/portfolio";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const COLORS = [
  "#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed",
  "#0891b2", "#ea580c", "#db2777", "#65a30d", "#4f46e5",
];

interface SectorAllocationChartProps {
  sectors: SectorSummaryType[];
}

export default function SectorAllocationChart({ sectors }: SectorAllocationChartProps) {
  if (sectors.length === 0) return null;

  const data = sectors.map((s) => ({
    name: s.sector || "Unknown",
    value: s.totalPresentValue,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Sector Allocation</h2>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
