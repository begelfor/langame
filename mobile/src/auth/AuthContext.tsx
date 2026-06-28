import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "../api/client";
import {
  clearTokens,
  loadTokens,
  saveAccessToken,
  saveTokens,
} from "./storage";

interface AuthState {
  initializing: boolean;
  isAuthenticated: boolean;
  player: api.Player | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  addXp: (amount: number) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [player, setPlayer] = useState<api.Player | null>(null);

  const logout = useCallback(async () => {
    await clearTokens();
    api.setTokens(null, null);
    setPlayer(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    api.setAuthCallbacks({
      onAccessTokenRefreshed: (access) => {
        void saveAccessToken(access);
      },
      onAuthFailure: () => {
        void logout();
      },
    });
  }, [logout]);

  useEffect(() => {
    (async () => {
      const tokens = await loadTokens();
      if (tokens) {
        api.setTokens(tokens.access, tokens.refresh);
      }
      setIsAuthenticated(!!tokens);
      setInitializing(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    await saveTokens({ access: result.access, refresh: result.refresh });
    api.setTokens(result.access, result.refresh);
    setPlayer(result.player ?? null);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const result = await api.register({
        email,
        password,
        display_name: displayName,
      });
      await saveTokens({ access: result.access, refresh: result.refresh });
      api.setTokens(result.access, result.refresh);
      setPlayer(result.player ?? null);
      setIsAuthenticated(true);
    },
    [],
  );

  const addXp = useCallback((amount: number) => {
    setPlayer((prev) =>
      prev ? { ...prev, total_xp: prev.total_xp + amount } : prev,
    );
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      isAuthenticated,
      player,
      login,
      register,
      logout,
      addXp,
    }),
    [initializing, isAuthenticated, player, login, register, logout, addXp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
