"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, T } from "@/lib/i18n";
import { useAuth, ROLE_DASHBOARD } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Home, Info, Map as MapIcon } from "lucide-react";

export default function Sidebar() {
  const { lang } = useLang();
  const { user } = useAuth();
  const path = usePathname();

  const publicNav = [
    { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    { href: "/overview", label: T.nav.overview[lang], icon: <Info className="h-4 w-4" /> },
    { href: "/map", label: T.nav.map[lang], icon: <MapIcon className="h-4 w-4" /> },
  ];

  const roleNav = user ? [
    { href: ROLE_DASHBOARD[user.role], label: "My Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ...publicNav,
  ] : publicNav;

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white hidden md:block">
      <div className="sticky top-[64px] h-[calc(100vh-64px)] flex flex-col p-4">
        <nav className="flex-1 space-y-1">
          {roleNav.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "bg-[color:var(--ap-navy)] text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                {n.icon}
                {n.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-zinc-100">
          <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            System Status
          </div>
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-500">Live Data Feed</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
