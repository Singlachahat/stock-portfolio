"use client";

import { useState, useEffect } from "react";
import { HoldingComputed } from "@/types/portfolio";
import StockSearchInput from "./StockSearchInput";
import { marketApi } from "@/lib/api";

interface HoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    symbol: string;
    quantity: number;
    purchasePrice: number;
    name?: string;
    sector?: string;
    exchange?: string;
  }) => Promise<void>;
  holding?: HoldingComputed | null;
  mode: "add" | "edit";
}

export default function HoldingModal({
  isOpen,
  onClose,
  onSubmit,
  holding,
  mode,
}: HoldingModalProps) {
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "",
    purchasePrice: "",
    name: "",
    sector: "",
    exchange: "NSE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    if (mode === "edit" && holding) {
      setFormData({
        symbol: holding.symbol,
        quantity: holding.quantity.toString(),
        purchasePrice: holding.purchasePrice.toString(),
        name: holding.name,
        sector: holding.sector,
        exchange: holding.exchange,
      });
    } else if (mode === "add") {
      setFormData({
        symbol: "",
        quantity: "",
        purchasePrice: "",
        name: "",
        sector: "",
        exchange: "NSE",
      });
    }
    setError(null);
  }, [mode, holding, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = {
        symbol: formData.symbol.trim().toUpperCase(),
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        name: formData.name.trim() || undefined,
        sector: formData.sector.trim() || undefined,
        exchange: formData.exchange.trim() || undefined,
      };

      if (!data.symbol || isNaN(data.quantity) || isNaN(data.purchasePrice)) {
        setError("Please fill in all required fields with valid values");
        setIsSubmitting(false);
        return;
      }

      if (data.quantity <= 0 || data.purchasePrice < 0) {
        setError("Quantity must be positive and price must be non-negative");
        setIsSubmitting(false);
        return;
      }

      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save holding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSelect = async (stock: { symbol: string; name: string; exchange: string; type: string }) => {
    setFormData((prev) => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.type === "ETF" ? "ETF" : prev.sector,
    }));
    setFetchingPrice(true);
    setError(null);
    try {
      const quote = await marketApi.getQuote(stock.symbol);
      if (quote.cmp != null && quote.cmp > 0) {
        setFormData((prev) => ({ ...prev, purchasePrice: quote.cmp.toFixed(2) }));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not fetch current price");
    } finally {
      setFetchingPrice(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto text-black">
        <div className="p-6 text-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              {mode === "add" ? "Add Holding" : "Edit Holding"}
            </h2>
            <button
              onClick={onClose}
              className="text-black/70 hover:text-black"
              disabled={isSubmitting}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {mode === "add" ? "Search Stock" : "Symbol"} <span className="text-red-500">*</span>
              </label>
              {mode === "add" ? (
                <StockSearchInput
                  onSelect={handleStockSelect}
                  disabled={isSubmitting}
                />
              ) : (
                <input
                  type="text"
                  value={formData.symbol}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-black"
                  disabled
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="e.g., 10"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Purchase Price (current price) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder={fetchingPrice ? "Fetching current price..." : "e.g., 150.50"}
                disabled={isSubmitting}
                required
              />
              {mode === "add" && (
                <p className="text-xs text-black/80 mt-1">
                  Fetched live when you select a stock. You can edit if needed.
                </p>
              )}
            </div>

            {mode === "add" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="e.g., Apple Inc"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Sector (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) =>
                      setFormData({ ...formData, sector: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="e.g., Technology"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Exchange (optional)
                  </label>
                  <select
                    value={formData.exchange}
                    onChange={(e) =>
                      setFormData({ ...formData, exchange: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NASDAQ">NASDAQ</option>
                    <option value="NYSE">NYSE</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : mode === "add" ? "Add" : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
