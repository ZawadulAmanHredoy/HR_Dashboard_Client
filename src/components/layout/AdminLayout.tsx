import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { LogoMark } from "@/components/icons";

/**
 * Standalone shell for the admin review console. Renders outside the regular
 * AppShell so there is no consultant sidebar or topbar — just the essentials:
 * a brand mark, a way out, and the page content.
 */
export function AdminLayout() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="text-brand-500" width={26} height={26} />
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-ink-900">
                CAREER ADVISOR
              </p>
              <p className="text-xs text-ink-500">Admin console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-ink-200 px-3 py-2 text-[13px] font-medium text-ink-600 transition-colors hover:bg-ink-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
