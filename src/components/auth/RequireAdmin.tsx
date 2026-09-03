import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

/**
 * Gates the review console. Runs inside RequireAuth, so a session already
 * exists here — this only decides whether that session may review
 * applications. The server enforces the same rule; this just keeps
 * non-admins from landing on a page that would only 403.
 */
export function RequireAdmin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
      </div>
    );
  }

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
