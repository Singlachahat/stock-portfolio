"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioWithComputed } from "@/types/portfolio";
import { portfolioApi, holdingsApi, marketApi } from "@/lib/api";
import PortfolioSummary from "@/components/PortfolioSummary";
import PortfolioTable from "@/components/PortfolioTable";
import SectorSummary from "@/components/SectorSummary";
import SectorAllocationChart from "@/components/SectorAllocationChart";
import TopHoldingsChart from "@/components/TopHoldingsChart";
import HoldingModal from "@/components/HoldingModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioWithComputed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchPortfolio = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await portfolioApi.getMyPortfolio();
      setPortfolio(data);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch portfolio:", err);
      if (err.response?.status === 401) {
        logout();
      } else {
        setError(err.response?.data?.error || "Failed to load portfolio");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, logout]);

  const refreshMarketData = useCallback(async () => {
    if (!isAuthenticated || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await marketApi.refreshMyPortfolio();
      await fetchPortfolio();
    } catch (err: any) {
      console.error("Failed to refresh market data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, isRefreshing, fetchPortfolio]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolio();
    }
  }, [isAuthenticated, fetchPortfolio]);

  useEffect(() => {
    if (!isAuthenticated || !portfolio) return;
    const interval = setInterval(refreshMarketData, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, portfolio, refreshMarketData]);

  const handleAddHolding = async (data: {
    symbol: string;
    quantity: number;
    purchasePrice: number;
    name?: string;
    sector?: string;
    exchange?: string;
  }) => {
    await holdingsApi.addHolding(data);
    await fetchPortfolio();
    await refreshMarketData();
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!confirm("Are you sure you want to delete this holding?")) return;
    try {
      await holdingsApi.deleteHolding(holdingId);
      await fetchPortfolio();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete holding");
    }
  };

  const openAddModal = () => setIsModalOpen(true);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchPortfolio();
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Portfolio Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <PortfolioSummary
            portfolio={portfolio}
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm"
          >
            + Add Holding
          </button>
          <button
            onClick={refreshMarketData}
            disabled={isRefreshing}
            className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? "Refreshing..." : "🔄 Refresh Market Data"}
          </button>
        </div>

        {portfolio.sectorSummary.length > 0 && (
          <div className="mb-6">
            <SectorSummary sectors={portfolio.sectorSummary} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {portfolio.sectorSummary.length > 0 && (
            <SectorAllocationChart sectors={portfolio.sectorSummary} />
          )}
          <TopHoldingsChart holdings={portfolio.holdings} maxBars={10} />
        </div>

        <div className="mb-6">
          <PortfolioTable
            holdings={portfolio.holdings}
            onDelete={handleDeleteHolding}
          />
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            Data updates automatically every 15 seconds. Market data from Yahoo
            Finance (unofficial API).
          </p>
        </div>
      </div>

      <HoldingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddHolding}
        holding={null}
        mode="add"
      />
    </div>
  );
}
