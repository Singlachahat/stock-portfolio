export function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null, decimals: number = 2): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

const GAIN_COLOR = "#16a34a";
const LOSS_COLOR = "#dc2626";
const NEUTRAL_COLOR = "#000000";

export function getGainLossStyle(value: number | null): { color: string } {
  const color =
    value === null || value === 0
      ? NEUTRAL_COLOR
      : value > 0
        ? GAIN_COLOR
        : LOSS_COLOR;
  return { color };
}

export function getGainLossColor(value: number | null): string {
  if (value === null || value === 0) return "text-black";
  return value > 0 ? "text-green-600" : "text-red-600";
}

export function getGainLossBgColor(value: number | null): string {
  if (value === null || value === 0) return "bg-gray-50";
  return value > 0 ? "bg-green-50" : "bg-red-50";
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  } catch {
    return "—";
  }
}
