import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ProfileProvider } from "@/context/ProfileProvider";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProfileProvider>
      <div className="flex min-h-screen bg-canvas p-0 lg:p-4">
        <div className="hidden lg:block">
          <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-l-3xl">
            <Sidebar />
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Close navigation"
              className="animate-backdrop-in absolute inset-0 bg-ink-900/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="animate-drawer-in absolute inset-y-0 left-0 w-[248px] shadow-pop">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 bg-white lg:rounded-r-3xl lg:shadow-card">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <div className="px-5 pb-10 pt-5 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </ProfileProvider>
  );
}
