"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DUMMY_USERS, ROLE_LABELS, ROLE_DASHBOARD } from "@/lib/auth";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useLang, T } from "@/lib/i18n";

export default function LoginPage() {
  const { user, login } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push(ROLE_DASHBOARD[user.role]);
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = login(email.trim(), password);
    setLoading(false);
    if (!ok) {
      setError(T.login.error[lang]);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError("");
  };

  const credentials = Object.values(DUMMY_USERS);

  return (
    <div className="min-h-[70vh] flex items-start justify-center pt-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-2xl bg-[color:var(--ap-navy)] flex items-center justify-center text-white font-bold text-2xl mx-auto">
            AP
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">{T.login.title[lang]}</h1>
          <p className="text-sm text-zinc-500">{T.login.subtitle[lang]}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{T.login.email[lang]}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)] focus:border-transparent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{T.login.password[lang]}</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[color:var(--ap-navy)] text-white py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <LogIn className="h-4 w-4" />
            {loading ? (lang === "en" ? "Signing in…" : "లాగిన్ అవుతోంది…") : T.login.signIn[lang]}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="rounded-xl border bg-zinc-50 p-4 space-y-3">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">{T.login.demoCredentials[lang]}</div>
          <div className="space-y-2">
            {credentials.map((c) => (
              <button
                key={c.email}
                onClick={() => fillCredentials(c.email, c.password)}
                className="w-full text-left rounded-lg bg-white border border-zinc-200 hover:border-[color:var(--ap-navy)] hover:bg-blue-50/30 px-3 py-2 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[color:var(--ap-navy)] group-hover:text-blue-700">
                    {ROLE_LABELS[c.role]}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{c.password}</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">{c.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
