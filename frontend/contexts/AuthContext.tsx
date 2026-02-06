"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, authApi, tokenManager } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken();
      const storedUser = tokenManager.getUser();

      if (token && storedUser) {
        try {
          const currentUser = await authApi.getCurrentUser(token);
          setUser(currentUser);
        } catch {
          tokenManager.clear();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password);
    tokenManager.setToken(token);
    tokenManager.setUser(user);
    setUser(user);
    router.push("/dashboard");
  };

  const signup = async (name: string, email: string, password: string) => {
    const { user, token } = await authApi.signup(name, email, password);
    tokenManager.setToken(token);
    tokenManager.setUser(user);
    setUser(user);
    router.push("/dashboard");
  };

  const logout = () => {
    tokenManager.clear();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
