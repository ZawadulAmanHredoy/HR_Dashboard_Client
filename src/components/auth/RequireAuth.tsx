import { Navigate, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/auth-context";

/** Gates the console routes: no session means a redirect to /login. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <AppShell />;
}
