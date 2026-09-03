import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  /** "google" for real sessions, "demo" for the credential-free fallback */
  provider: string;
  /** Listed in admin_emails — routes to the application review console. */
  isAdmin?: boolean;
};

/**
 * What the server reports about its own auth setup. "unknown" is local-only:
 * the API could not be reached, so we know nothing about how it is configured.
 */
export type AuthMode = "google" | "demo" | "unconfigured" | "unknown";

export type AuthState = {
  user: AuthUser | null;
  /** True while the initial session lookup is in flight */
  loading: boolean;
  error: string | null;
  mode: AuthMode;
  /** Leaves the SPA for the server's Google consent redirect. */
  signInWithGoogle: (returnTo?: string) => void;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  mode: "unknown",
  signInWithGoogle: () => {},
  signInAsDemo: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
