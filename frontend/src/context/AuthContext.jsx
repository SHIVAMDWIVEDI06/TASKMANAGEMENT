import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredToken, setAuthToken, storeToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((t) => {
    setTokenState(t);
    storeToken(t);
    setAuthToken(t);
  }, []);

  useEffect(() => {
    setAuthToken(token || null);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          applyToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, applyToken]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/api/auth/login", { email, password });
      applyToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [applyToken]
  );

  const signup = useCallback(
    async (payload) => {
      const { data } = await api.post("/api/auth/signup", payload);
      applyToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [applyToken]
  );

  const logout = useCallback(() => {
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, token, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
