import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as api from "../lib/api";
import { AuthContext } from "./auth";
import type { AuthUser } from "./auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (password: string) => {
    const token = await api.login({ username: "admin", password });
    api.setAuthToken(token);
    setUser({ token, password });
  }, []);

  const logout = useCallback(() => {
    api.setAuthToken(null);
    setUser(null);
  }, []);

  // Transparently re-authenticate when a request comes back 401 so
  // individual pages never need their own token-refresh logic.
  useEffect(() => {
    api.setReauthHandler(
      user
        ? async () => {
            const token = await api.login({
              username: "admin",
              password: user.password,
            });
            setUser((current) => (current ? { ...current, token } : current));
            return token;
          }
        : null,
    );
    return () => api.setReauthHandler(null);
  }, [user]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
