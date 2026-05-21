"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useLang, T } from "@/lib/i18n";
import { useAuth, ROLE_LABELS, ROLE_DASHBOARD } from "@/lib/auth";
import { useAcademicYear, type AcademicYear } from "@/lib/academic-year";
import { Languages, LogOut, LayoutDashboard, ChevronDown, CalendarDays } from "lucide-react";

function YearSelectorInner() {
  const { year, setYear, years } = useAcademicYear();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[color:var(--ap-orange)]/20 hover:bg-[color:var(--ap-orange)]/30 border border-[color:var(--ap-orange)]/40 text-sm font-medium"
        aria-label="Select academic year"
      >
        <CalendarDays className="h-4 w-4 text-[color:var(--ap-orange)]" />
        <span className="hidden sm:inline text-white/90">AY</span>
        <span className="font-semibold text-[color:var(--ap-orange)]">{year}</span>
        <ChevronDown className="h-3.5 w-3.5 text-white/60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-100">
            Academic Year
          </div>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setYear(y as AcademicYear); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                y === year
                  ? "text-[color:var(--ap-navy)] font-semibold bg-blue-50"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${y === year ? "bg-[color:var(--ap-orange)]" : ""}`} />
              AY {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { lang, toggle } = useLang();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--ap-navy)] text-white shadow-sm">
      <div className="flex items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="h-10 w-10 rounded-full bg-[color:var(--ap-orange)] flex items-center justify-center text-white font-bold text-sm shrink-0">
            AP
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="text-sm font-semibold truncate">{T.appName[lang]}</div>
            <div className="text-[11px] text-white/70 truncate hidden lg:block">{T.subtitle[lang]}</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 ml-auto">
          {/* Year selector — hidden on landing page */}
          {!isLandingPage && (
            <Suspense
              fallback={
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[color:var(--ap-orange)]/20 border border-[color:var(--ap-orange)]/40 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-[color:var(--ap-orange)]" />
                  <span className="font-semibold text-[color:var(--ap-orange)]">2024-25</span>
                </div>
              }
            >
              <YearSelectorInner />
            </Suspense>
          )}

          <button
            onClick={toggle}
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "తెలుగు" : "English"}
          </button>

          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
              >
                <div className="h-6 w-6 rounded-full bg-[color:var(--ap-orange)] flex items-center justify-center text-xs font-bold">
                  {user.name[0]}
                </div>
                <span className="hidden md:inline">{user.name}</span>
                <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5 hidden sm:inline">
                  {ROLE_LABELS[user.role]}{user.role === "teacher" && user.grade ? ` (Class ${user.grade})` : ""}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-white/70" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <div className="text-xs font-semibold text-zinc-900">{user.name}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                    <div className="text-xs text-[color:var(--ap-navy)] font-medium mt-0.5">
                      {ROLE_LABELS[user.role]}
                      {user.role === "teacher" && user.grade && ` - Class ${user.grade}`}
                    </div>
                  </div>
                  <Link
                    href={ROLE_DASHBOARD[user.role]}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                    {T.common.myDashboard[lang]}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {T.common.signOut[lang]}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-4 py-1.5 rounded-md bg-[color:var(--ap-orange)] hover:opacity-90 text-sm font-medium"
            >
              {T.common.signIn[lang]}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
