import { createContext } from "react";

export interface AuthUser {
  token: string;
  /** Kept in memory only, so expired tokens can be refreshed transparently. */
  password: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  /** Throws an axios error on failure so callers can map it to a message. */
  login: (password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
