"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import type { Teacher } from "@/lib/types";
import { Search, Filter, Mail, Phone, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HMTeachersListPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
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

  const subjects = ["All", ...Array.from(new Set(teachers.map(t => t.name))).slice(0, 5).map(() => "Mathematics")];
  const classes = ["All", ...Array.from(new Set(teachers.map(() => "All")))].slice(0, 1);

  const filtered = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "All" || subjectFilter === "Mathematics";
    const matchesClass = classFilter === "All";
    return matchesSearch && matchesSubject && matchesClass;
  });

  return (
    <div className="space-y-6">
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
              placeholder={lang === "en" ? "Search by name..." : "పేరు ద్వారా వెతకండి..."}
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
          <div className="p-6 text-center text-zinc-500">
            {lang === "en" ? "No teachers found." : "ఉపాధ్యాయులు ఎవరూ కనుగొనబడలేదు."}
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
