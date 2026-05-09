"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, T } from "@/lib/i18n";
import { useAuth, ROLE_DASHBOARD } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Home, Info, Map as MapIcon, Users, Database, Activity, BookOpen, Heart, Building2 } from "lucide-react";

export default function Sidebar() {
  const { lang } = useLang();
  const { user } = useAuth();
  const path = usePathname();

  const getNav = () => {
    const nav = [];

    if (user) {
      // My Dashboard (role specific)
      nav.push({ 
        href: ROLE_DASHBOARD[user.role], 
        label: T.common.myDashboard[lang], 
        icon: <LayoutDashboard className="h-4 w-4" /> 
      });

      // Role specific pages
      if (user.role === "teacher") {
        nav.push({ href: "/teacher/students", label: T.nav.students[lang], icon: <Users className="h-4 w-4" /> });
        nav.push({ href: "/teacher/data", label: T.nav.data[lang], icon: <Database className="h-4 w-4" /> });
        nav.push({ href: "/teacher/analytics", label: T.nav.analytics[lang], icon: <Activity className="h-4 w-4" /> });
      }

      if (user.role === "hm") {
        nav.push({ href: "/hm/students", label: T.nav.students[lang], icon: <Users className="h-4 w-4" /> });
        nav.push({ href: "/hm/teachers", label: T.nav.teachers[lang], icon: <Users className="h-4 w-4" /> });
        nav.push({ href: "/hm/data", label: T.nav.data[lang], icon: <Database className="h-4 w-4" /> });
        nav.push({ href: "/hm/analytics", label: T.nav.analytics[lang], icon: <Activity className="h-4 w-4" /> });
      }

      // District Heatmap - ONLY for district officer
      if (user.role === "district") {
        nav.push({ href: "/dashboard/district/schools", label: T.nav.schools[lang], icon: <Home className="h-4 w-4" /> });
        nav.push({ href: "/dashboard/district/data", label: T.nav.data[lang], icon: <Database className="h-4 w-4" /> });
        nav.push({ href: "/dashboard/district/analytics", label: T.nav.analytics[lang], icon: <Activity className="h-4 w-4" /> });
        nav.push({ href: "/dashboard/district/map", label: T.nav.map[lang], icon: <MapIcon className="h-4 w-4" /> });
      }

      // School Education Department — super admin, sees everything
      if (user.role === "sed") {
        nav.push({ href: "/dashboard/sed/districts", label: lang === "en" ? "Districts" : "జిల్లాలు", icon: <Building2 className="h-4 w-4" /> });
        nav.push({ href: "/dashboard/sed/analytics", label: T.nav.analytics[lang], icon: <Activity className="h-4 w-4" /> });
        nav.push({ href: "/map", label: T.nav.stateMap[lang], icon: <MapIcon className="h-4 w-4" /> });
      }

      // Model Overview / Community / API Docs — district & SED only
      if (user.role === "district" || user.role === "sed") {
        nav.push({ href: "/overview", label: T.nav.overview[lang], icon: <Info className="h-4 w-4" /> });
        nav.push({ href: "/community", label: lang === "en" ? "Community Report" : "కమ్యూనిటీ నివేదిక", icon: <Heart className="h-4 w-4" /> });
        nav.push({ href: "/api-docs", label: lang === "en" ? "API Docs" : "API డాక్స్", icon: <BookOpen className="h-4 w-4" /> });
      }
    } else {
      // Guests only see Home
      nav.push({ href: "/", label: T.common.home[lang], icon: <Home className="h-4 w-4" /> });
    }

    return nav;
  };

  const navItems = getNav();

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-zinc-50/30 hidden md:block">
      <div className="sticky top-[64px] h-[calc(100vh-64px)] flex flex-col px-3 py-6">
        <div className="flex-1 space-y-8">
          {/* Main Navigation */}
          <div>
            <div className="px-4 mb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              {lang === "en" ? "Main Menu" : "ప్రధాన మెనూ"}
            </div>
            <nav className="space-y-1">
              {navItems.filter(n => !n.href.includes('overview') && !n.href.includes('map') && !n.href.includes('community') && !n.href.includes('api-docs')).map((n) => {
                const active = n.href === "/" 
                  ? path === "/" 
                  : (user && n.href === ROLE_DASHBOARD[user.role] ? path === n.href : path.startsWith(n.href));
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      active
                        ? "bg-white text-[color:var(--ap-navy)] shadow-sm border border-zinc-200/50"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      active ? "bg-[color:var(--ap-navy)] text-white" : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600"
                    )}>
                      {n.icon}
                    </div>
                    {n.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[color:var(--ap-navy)]" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Analytics & Reports — district/SED only */}
          {navItems.some(n => n.href.includes('overview') || n.href.includes('community') || n.href.includes('api-docs')) && (
          <div>
            <div className="px-4 mb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              {lang === "en" ? "Analytics" : "విశ్లేషణలు"}
            </div>
            <nav className="space-y-1">
              {navItems.filter(n => n.href.includes('overview') || n.href.includes('map') || n.href.includes('community') || n.href.includes('api-docs')).map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      active
                        ? "bg-white text-[color:var(--ap-navy)] shadow-sm border border-zinc-200/50"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      active ? "bg-[color:var(--ap-navy)] text-white" : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600"
                    )}>
                      {n.icon}
                    </div>
                    {n.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[color:var(--ap-navy)]" />}
                  </Link>
                );
              })}
            </nav>
          </div>
          )}
        </div>

        {/* Status Card */}
        <div className="mt-auto p-4 rounded-2xl bg-white border border-zinc-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {T.common.systemStatus[lang]}
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Database className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900">{T.common.liveDataFeed[lang]}</div>
              <div className="text-[10px] text-zinc-500">{lang === "en" ? "Syncing every 5m" : "ప్రతి 5 నిమిషాలకు"}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
