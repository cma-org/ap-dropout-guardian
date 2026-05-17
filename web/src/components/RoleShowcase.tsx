"use client";
import { useState } from "react";
import { useLang, T } from "@/lib/i18n";
import {
  UserCheck, Users, BarChart2, LayoutDashboard, ArrowRight
} from "lucide-react";

type RoleData = {
  title: string;
  sub: string;
  resp: string;
  workflow: string;
  features: readonly string[];
};

type RoleStyle = {
  icon: typeof UserCheck;
  dotBg: string;
  txtColor: string;
  badgeBg: string;
  badgeTxt: string;
  iconBg: string;
  iconTxt: string;
};

const STYLES: RoleStyle[] = [
  { icon: UserCheck, dotBg: "bg-blue-600", txtColor: "text-blue-600", badgeBg: "bg-blue-50", badgeTxt: "text-blue-600", iconBg: "bg-blue-50", iconTxt: "text-blue-600" },
  { icon: Users, dotBg: "bg-purple-600", txtColor: "text-purple-600", badgeBg: "bg-purple-50", badgeTxt: "text-purple-600", iconBg: "bg-purple-50", iconTxt: "text-purple-600" },
  { icon: BarChart2, dotBg: "bg-emerald-600", txtColor: "text-emerald-600", badgeBg: "bg-emerald-50", badgeTxt: "text-emerald-600", iconBg: "bg-emerald-50", iconTxt: "text-emerald-600" },
  { icon: LayoutDashboard, dotBg: "bg-amber-600", txtColor: "text-amber-600", badgeBg: "bg-amber-50", badgeTxt: "text-amber-600", iconBg: "bg-amber-50", iconTxt: "text-amber-600" },
];

export default function RoleShowcase() {
  const { lang } = useLang();
  const t = T.landing;

  const [activeIndex, setActiveIndex] = useState(0);

  const roles: RoleData[] = [
    { title: t.role1Title[lang], sub: t.role1Sub[lang], resp: t.role1Resp[lang], workflow: t.role1Workflow[lang], features: t.role1Features[lang] },
    { title: t.role2Title[lang], sub: t.role2Sub[lang], resp: t.role2Resp[lang], workflow: t.role2Workflow[lang], features: t.role2Features[lang] },
    { title: t.role3Title[lang], sub: t.role3Sub[lang], resp: t.role3Resp[lang], workflow: t.role3Workflow[lang], features: t.role3Features[lang] },
    { title: t.role4Title[lang], sub: t.role4Sub[lang], resp: t.role4Resp[lang], workflow: t.role4Workflow[lang], features: t.role4Features[lang] },
  ];

  const current = roles[activeIndex];
  const style = STYLES[activeIndex];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:gap-12 xl:gap-20">

          {/* ─── LEFT: Desktop vertical nav ─── */}
          <aside className="hidden md:flex md:w-72 xl:w-80 flex-col justify-start shrink-0">
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-900 mb-12 tracking-tight leading-snug">
              {t.roleTitle[lang]}
            </h2>

            <nav className="space-y-1" aria-label="User roles">
              {roles.map((r, i) => {
                const active = i === activeIndex;
                const s = STYLES[i];
                return (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-5 px-4 py-[18px] rounded-xl transition-all duration-500 text-left group ${
                      active ? "bg-slate-50 shadow-sm" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-[14px] h-[14px] rounded-full border-2 transition-all duration-500 ${
                          active
                            ? `${s.dotBg} border-transparent scale-110 shadow-sm`
                            : "bg-transparent border-slate-300 group-hover:border-slate-400"
                        }`}
                      />
                      {i < roles.length - 1 && (
                        <div
                          className={`w-0.5 h-8 mt-1 transition-all duration-500 ${
                            active ? "bg-slate-200" : "bg-slate-100"
                          }`}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-500 ${
                          active ? s.txtColor : "text-slate-400"
                        }`}
                      >
                        {r.sub}
                      </div>
                      <div
                        className={`font-bold text-sm transition-colors duration-500 ${
                          active ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {r.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-10 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((activeIndex + 1) / roles.length) * 100}%` }}
              />
            </div>
          </aside>

          {/* ─── MOBILE: heading + horizontal tabs ─── */}
          <div className="md:hidden mb-8">
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-900 mb-6 tracking-tight leading-snug">
              {t.roleTitle[lang]}
            </h2>
            <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-3 snap-x snap-mandatory scrollbar-hide">
              {roles.map((r, i) => {
                const active = i === activeIndex;
                const s = STYLES[i];
                return (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-left transition-all duration-300 snap-start ${
                      active
                        ? "bg-slate-100 shadow-sm"
                        : "bg-transparent border border-slate-100"
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        active ? s.txtColor : "text-slate-400"
                      }`}
                    >
                      {r.sub}
                    </div>
                    <div
                      className={`text-xs font-bold transition-colors ${
                        active ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {r.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── RIGHT: Role detail panel ─── */}
          <main className="flex-1 min-h-0">
            <RoleContent role={current} style={style} key={activeIndex} />
          </main>
        </div>
      </div>
    </section>
  );
}

function RoleContent({ role, style }: { role: RoleData; style: RoleStyle }) {
  const IconComp = style.icon;

  return (
    <div className="max-w-xl animate-fade-in-up">
      <div
        className={`h-16 w-16 rounded-2xl ${style.iconBg} ${style.iconTxt} flex items-center justify-center mb-6 shadow-lg`}
      >
        <IconComp className="h-8 w-8" />
      </div>

      <div className={`text-[12px] font-bold ${style.txtColor} uppercase tracking-widest mb-2`}>
        {role.sub}
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
        {role.title}
      </h3>
      <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed mb-7">
        {role.resp}
      </p>

      <div className="mb-7">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Workflow
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role.workflow.split("→").map((step, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className={`h-3.5 w-3.5 ${style.txtColor}`} />}
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 font-medium text-[13px] whitespace-nowrap">
                {step.trim()}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Key Features
        </div>
        <div className="flex flex-wrap gap-2">
          {role.features.map((f, i) => (
            <span
              key={i}
              className={`text-[11px] px-3 py-1.5 rounded-full border ${style.badgeBg} ${style.badgeTxt} border-slate-100 font-medium`}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
