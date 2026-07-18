import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "./useAuth";

/**
 * Redirect to /login when there is no authenticated user.
 * Returns the current user (or null while the redirect is in flight).
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [user, navigate, location.pathname]);

  return user;
}
