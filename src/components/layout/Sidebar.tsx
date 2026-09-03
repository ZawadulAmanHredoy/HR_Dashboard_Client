import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";
import {
  CalendarIcon,
  FolderIcon,
  GridIcon,
  HelpIcon,
  LogoMark,
  LogoutIcon,
  UserIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/icons";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: GridIcon },
  { href: "/availability", label: "My Availability", icon: CalendarIcon },
  { href: "/client-records", label: "Client Records", icon: FolderIcon },
  { href: "/consults", label: "My Consults", icon: UsersIcon },
  { href: "/online-consult", label: "Online Consult", icon: VideoIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/help", label: "Help", icon: HelpIcon },
] as const;

/** Only rendered for admins — everyone else has no review console to open. */
const ADMIN_NAV_ITEM = {
  href: "/admin",
  label: "Applications",
  icon: UsersIcon,
} as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const navItems = user?.isAdmin ? [ADMIN_NAV_ITEM, ...NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <LogoMark className="text-brand-500" width={28} height={28} />
        <span className="text-[15px] font-semibold tracking-tight text-ink-900">
          CAREER ADVISOR
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/" || pathname === "/appointments"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-brand-500 text-white shadow-[0_8px_18px_rgba(81,56,238,0.28)]"
                  : "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
              )}
            >
              <Icon width={18} height={18} />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <LogoutIcon width={18} height={18} />
          Logout
        </button>
      </nav>
    </aside>
  );
}
