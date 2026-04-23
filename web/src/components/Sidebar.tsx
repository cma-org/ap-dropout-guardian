"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, T } from "@/lib/i18n";
import { useAuth, ROLE_DASHBOARD } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Home, Info, Map as MapIcon, Users, Database } from "lucide-react";

export default function Sidebar() {
  const { lang } = useLang();
  const { user } = useAuth();
  const path = usePathname();

  const getNav = () => {
    const nav = [];

    // All users see Home and Overview
    nav.push({ href: "/", label: T.common.home[lang], icon: <Home className="h-4 w-4" /> });
    nav.push({ href: "/overview", label: T.nav.overview[lang], icon: <Info className="h-4 w-4" /> });

    if (user) {
      // My Dashboard (role specific)
      nav.unshift({ 
        href: ROLE_DASHBOARD[user.role], 
        label: T.common.myDashboard[lang], 
        icon: <LayoutDashboard className="h-4 w-4" /> 
      });

      // Role specific pages
      if (user.role === "teacher") {
        nav.push({ href: "/teacher/students", label: T.nav.students[lang], icon: <Users className="h-4 w-4" /> });
        nav.push({ href: "/teacher/data", label: T.nav.data[lang], icon: <Database className="h-4 w-4" /> });
      }

      // District Heatmap - ONLY for district officer and above (rtgs)
      if (user.role === "district" || user.role === "rtgs") {
        nav.push({ href: "/map", label: T.nav.map[lang], icon: <MapIcon className="h-4 w-4" /> });
      }
    } else {
      // Guest users see map too
      nav.push({ href: "/map", label: T.nav.map[lang], icon: <MapIcon className="h-4 w-4" /> });
    }

    return nav;
  };

  const navItems = getNav();

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white hidden md:block">
      <div className="sticky top-[64px] h-[calc(100vh-64px)] flex flex-col p-4">
        <nav className="flex-1 space-y-1">
          {navItems.map((n) => {
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
            {T.common.systemStatus[lang]}
          </div>
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-500">{T.common.liveDataFeed[lang]}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
