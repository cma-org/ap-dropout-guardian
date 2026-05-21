"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { Teacher } from "@/lib/types";
import { Search, Filter, Mail, BookOpen, User, UserPlus, X, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function AddTeacherModal({
  onClose,
  onAdded,
  schoolId,
  schoolName,
  district,
  lang,
}: {
  onClose: () => void;
  onAdded: (t: Teacher) => void;
  schoolId: number;
  schoolName: string | null;
  district: string | null;
  lang: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, schoolId, schoolName, district }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (lang === "en" ? "Failed to add teacher." : "ఉపాధ్యాయుడిని జోడించడం విఫలమైంది."));
      } else {
        onAdded(data as Teacher);
        onClose();
      }
    } catch {
      setError(lang === "en" ? "Network error. Try again." : "నెట్‌వర్క్ లోపం. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900 text-lg">
            {lang === "en" ? "Add Teacher" : "ఉపాధ్యాయుడిని జోడించండి"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {lang === "en" ? "Full Name" : "పూర్తి పేరు"} *
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "en" ? "e.g. Ravi Kumar" : "ఉదా. రవి కుమార్"}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {lang === "en" ? "Email Address" : "ఇమెయిల్ చిరునామా"} *
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.ap.gov.in"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {lang === "en" ? "Temporary Password" : "తాత్కాలిక పాస్‌వర్డ్"} *
            </label>
            <div className="relative">
              <input
                required
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/20"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              {lang === "en"
                ? "Share this with the teacher. They should change it after first login."
                : "దీన్ని ఉపాధ్యాయుడికి తెలియజేయండి. మొదటి లాగిన్ తర్వాత మార్చాలి."}
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              {lang === "en" ? "Cancel" : "రద్దు చేయండి"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {lang === "en" ? "Add Teacher" : "జోడించండి"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HMTeachersListPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.schoolId) {
      fetch(`/api/users?role=teacher&schoolId=${user.schoolId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => { setTeachers(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {showAddModal && user && (
        <AddTeacherModal
          lang={lang}
          schoolId={user.schoolId as number}
          schoolName={user.schoolName ?? null}
          district={user.district ?? null}
          onClose={() => setShowAddModal(false)}
          onAdded={(t) => setTeachers(prev => [t, ...prev])}
        />
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{T.nav.teachers[lang]}</h1>
          <p className="text-zinc-500">
            {user?.schoolName || "Your School"} · {teachers.length} {lang === "en" ? "Staff Members" : "సిబ్బంది"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all",
              showFilters
                ? "bg-[color:var(--ap-navy)] text-white border-[color:var(--ap-navy)]"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <Filter className="h-4 w-4" /> {T.common.filter[lang]}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            {lang === "en" ? "Add Teacher" : "ఉపాధ్యాయుడిని జోడించండి"}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className={cn(
          "p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center gap-4 transition-all duration-300 overflow-hidden",
          showFilters ? "max-h-[200px] opacity-100" : "max-h-0 py-0 opacity-0 border-none"
        )}>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={lang === "en" ? "Search by name or email..." : "పేరు లేదా ఇమెయిల్ ద్వారా వెతకండి..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-zinc-500">
            {lang === "en" ? "Loading teachers..." : "ఉపాధ్యాయులను లోడ్ చేస్తోంది..."}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <User className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {teachers.length === 0
                ? (lang === "en" ? "No teachers added yet." : "ఇంకా ఉపాధ్యాయులు జోడించబడలేదు.")
                : (lang === "en" ? "No teachers match your search." : "మీ శోధనకు సరిపోలే ఉపాధ్యాయులు లేరు.")}
            </p>
            {teachers.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
                {lang === "en" ? "Add First Teacher" : "మొదటి ఉపాధ్యాయుడిని జోడించండి"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filtered.map((t) => (
              <div key={t.id} className="group relative rounded-2xl border border-zinc-100 bg-white p-5 hover:border-[color:var(--ap-navy)]/30 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-[color:var(--ap-navy)]/10 group-hover:text-[color:var(--ap-navy)] transition-colors">
                    <User className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="font-bold text-zinc-900 group-hover:text-[color:var(--ap-navy)] transition-colors">{t.name}</h3>
                <div className="text-xs text-zinc-500 mb-4">
                  {lang === "en" ? "Teacher" : "ఉపాధ్యాయుడు"} · {t.schoolName || `#${t.schoolId}`}
                </div>

                <div className="space-y-2 border-t border-zinc-50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    {t.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                    {t.district ?? (lang === "en" ? "Assigned to school" : "పాఠశాలకు కేటాయించబడింది")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
