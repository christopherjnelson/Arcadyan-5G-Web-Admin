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
  // individual pages never need their own token-refresh logic. If the
  // stored credential is rejected (password changed elsewhere, factory
  // reset, ...), drop the session instead of retrying /auth/login on
  // every poll and risking a lockout of the admin account.
  useEffect(() => {
    api.setReauthHandler(
      user
        ? async () => {
            try {
              const token = await api.login({
                username: "admin",
                password: user.password,
              });
              setUser((current) =>
                current ? { ...current, token } : current,
              );
              return token;
            } catch (error) {
              logout();
              throw error;
            }
          }
        : null,
    );
    return () => api.setReauthHandler(null);
  }, [user, logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
