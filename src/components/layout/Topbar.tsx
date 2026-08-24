import { useLocation, useNavigate } from "react-router-dom";
import { BellIcon, ChevronDown } from "@/components/icons";
import { Menu } from "@/components/ui/Menu";
import { FALLBACK_PROFILE, useProfile } from "@/context/profile-context";
import { useAuth } from "@/context/auth-context";

/** Per-route heading; the subtitle replaces the greeting where the design has one. */
const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/availability": "My Availability",
  "/client-records": "Client Records",
  "/consults": "My Consults",
  "/online-consult": "Online Consult",
  "/profile": "Profile",
  "/help": "Help",
};

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { user: account, signOut } = useAuth();
  const user = profile ?? FALLBACK_PROFILE;
  const detail = pathname.startsWith("/client-records/");
  const title = detail ? "Client Details" : (TITLES[pathname] ?? "Dashboard");
  const subtitle = detail ? "Manage and view client details" : `Hi, ${user.name}`;

  return (
    <header className="sticky top-0 z-20 bg-white/85 px-5 pt-4 backdrop-blur lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onOpenMenu}
            className="rounded-lg border border-ink-200 p-2 text-ink-500 lg:hidden"
          >
            <span className="block h-0.5 w-4 bg-current" />
            <span className="mt-1 block h-0.5 w-4 bg-current" />
            <span className="mt-1 block h-0.5 w-4 bg-current" />
          </button>
          <div>
            <p className="text-[13px] text-ink-500">{subtitle}</p>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Menu
            className="px-2 py-1.5 text-ink-500 hover:text-ink-900"
            label={<span className="text-[13px]">EN</span>}
            items={[{ label: "English (EN)" }, { label: "বাংলা (BN)" }]}
          />

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <BellIcon width={18} height={18} />
            <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
          </button>

          <Menu
            showChevron={false}
            className="gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-ink-100"
            label={
              <>
                {account?.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-600">
                    {user.initials}
                  </span>
                )}
                <span className="hidden text-[13px] text-ink-700 sm:inline">
                  {user.shortName}
                </span>
                <ChevronDown width={14} height={14} className="text-ink-400" />
              </>
            }
            items={[
              { label: "View profile", onSelect: () => navigate("/profile") },
              { label: "Account settings", onSelect: () => navigate("/profile") },
              { label: "Log out", danger: true, onSelect: () => void signOut() },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
