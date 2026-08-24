import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, API_BASE_URL, setUnauthorizedHandler } from "@/lib/api";
import {
  AuthContext,
  type AuthMode,
  type AuthUser,
} from "@/context/auth-context";

type SessionPayload = { user: AuthUser | null; mode: AuthMode };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("unknown");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The session cookie is httpOnly, so the server is the only source of truth.
  const loadSession = useCallback(async () => {
    try {
      const session = await api.get<SessionPayload>("/auth/session");
      setUser(session.user);
      setMode(session.mode);
      setError(null);
    } catch {
      // Unreachable API: stay in "unknown" so the UI reports a connection
      // problem rather than claiming credentials are missing.
      setUser(null);
      setMode("unknown");
      setError(
        `Cannot reach the API. Is the server running on ${API_BASE_URL === "/api" ? "port 3000" : API_BASE_URL}?`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const signOut = useCallback(async () => {
    await api.post("/auth/logout", {});
    setUser(null);
  }, []);

  // A 401 from any endpoint means the cookie expired — drop the local session.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  /** Full page navigation: the OAuth dance belongs to the server, not the SPA. */
  const signInWithGoogle = useCallback((returnTo = "/") => {
    const query = new URLSearchParams({ redirect: returnTo });
    window.location.href = `${API_BASE_URL}/auth/google?${query.toString()}`;
  }, []);

  const signInAsDemo = useCallback(async () => {
    setError(null);
    try {
      const demoUser = await api.post<AuthUser>("/auth/demo", {});
      setUser(demoUser);
    } catch (demoError) {
      setError(
        demoError instanceof Error ? demoError.message : "Demo sign-in failed",
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      mode,
      signInWithGoogle,
      signInAsDemo,
      signOut,
    }),
    [user, loading, error, mode, signInWithGoogle, signInAsDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
