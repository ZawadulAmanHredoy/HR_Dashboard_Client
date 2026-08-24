import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
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

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <LogoMark className="text-brand-500" width={28} height={28} />
        <span className="text-[15px] font-semibold tracking-tight text-ink-900">
          AI CV MAKER
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
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

      <div className="p-4">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-4 pb-4 pt-3 text-white">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-brand-500/40 blur-2xl" />
          <img
            src="/consultant.svg"
            alt=""
            width={110}
            height={132}
            className="mx-auto -mb-1 h-[104px] w-auto"
          />
          <p className="relative text-center text-[13px] font-semibold leading-snug">
            Get faster
            <br />
            and better
            <br />
            Service
          </p>
          <Button size="sm" className="relative mt-3 w-full">
            Go Pro
          </Button>
        </div>
      </div>
    </aside>
  );
}
