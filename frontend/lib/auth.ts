import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: string;
  name: string;
  email: string;
  portfolio: {
    id: string;
    name: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/users/signup`, {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
      email,
      password,
    });
    return response.data;
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },

  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_token", token);
  },

  removeToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  },

  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("auth_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_user", JSON.stringify(user));
  },

  removeUser: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_user");
  },

  clear: (): void => {
    tokenManager.removeToken();
    tokenManager.removeUser();
  },
};
