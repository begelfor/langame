import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "../api/client";
import { clearTokens, loadTokens, saveTokens } from "./storage";

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
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [player, setPlayer] = useState<api.Player | null>(null);

  useEffect(() => {
    (async () => {
      const tokens = await loadTokens();
      setIsAuthenticated(!!tokens);
      setInitializing(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    await saveTokens({ access: result.access, refresh: result.refresh });
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
      setPlayer(result.player ?? null);
      setIsAuthenticated(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearTokens();
    setPlayer(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      isAuthenticated,
      player,
      login,
      register,
      logout,
    }),
    [initializing, isAuthenticated, player, login, register, logout],
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
