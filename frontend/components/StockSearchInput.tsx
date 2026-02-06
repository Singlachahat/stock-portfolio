"use client";

import { useState, useEffect, useRef } from "react";
import { stocksApi } from "@/lib/api";

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface StockSearchInputProps {
  onSelect: (stock: Stock) => void;
  disabled?: boolean;
}

export default function StockSearchInput({ onSelect, disabled }: StockSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const stocks = await stocksApi.searchStocks(query);
        setResults(stocks);
        setShowResults(true);
      } catch (err: any) {
        console.error("Search error:", err);
        setError("Failed to search stocks");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (stock: Stock) => {
    setQuery(stock.symbol);
    setShowResults(false);
    onSelect(stock);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setShowResults(true);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        placeholder="Search stocks... (e.g., Apple, AAPL, Microsoft)"
        disabled={disabled}
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto text-black">
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors text-black"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">{stock.symbol}</div>
                  <div className="text-sm text-black/80">{stock.name}</div>
                </div>
                <div className="text-xs text-black/70">{stock.exchange}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-black">
          No stocks found for "{query}"
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}

      <div className="text-xs text-black/80 mt-1">
        💡 Tip: Search by company name or symbol (e.g., "Apple", "AAPL", "Reliance")
      </div>
    </div>
  );
}
