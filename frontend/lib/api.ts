import axios from "axios";
import type {
  PortfolioWithComputed,
  AddHoldingRequest,
  UpdateHoldingRequest,
  RefreshMarketRequest,
} from "@/types/portfolio";
import { tokenManager } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const portfolioApi = {
  getMyPortfolio: async (): Promise<PortfolioWithComputed> => {
    const response = await api.get(`/api/portfolios/me`);
    return response.data;
  },

  updatePortfolioName: async (name: string) => {
    const response = await api.patch(`/api/portfolios/me`, { name });
    return response.data;
  },
};

export const holdingsApi = {
  addHolding: async (data: AddHoldingRequest) => {
    const response = await api.post(`/api/portfolios/me/holdings`, data);
    return response.data;
  },

  updateHolding: async (holdingId: string, data: UpdateHoldingRequest) => {
    const response = await api.patch(
      `/api/portfolios/me/holdings/${holdingId}`,
      data
    );
    return response.data;
  },

  deleteHolding: async (holdingId: string) => {
    await api.delete(`/api/portfolios/me/holdings/${holdingId}`);
  },
};

export const marketApi = {
  getQuote: async (symbol: string) => {
    const response = await api.get(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
    return response.data;
  },

  refreshMarketData: async (symbols?: string[]) => {
    const data: RefreshMarketRequest = symbols ? { symbols } : {};
    const response = await api.post("/api/market/refresh", data);
    return response.data;
  },

  refreshMyPortfolio: async () => {
    const user = tokenManager.getUser();
    if (!user?.portfolio?.id) {
      throw new Error("No portfolio found");
    }
    const response = await api.post("/api/market/refresh", {
      portfolioId: user.portfolio.id,
    });
    return response.data;
  },
};

export const stocksApi = {
  searchStocks: async (query: string) => {
    const response = await api.get(`/api/stocks/search?q=${encodeURIComponent(query)}`);
    return response.data.stocks;
  },
};

export default api;
