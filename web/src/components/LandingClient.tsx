"use client";
import Link from "next/link";
import {
  Brain, BarChart2, Plug, Users, ArrowRight, Lock, 
  Target, ShieldCheck, HeartHandshake, Database,
  TrendingUp, Activity, UserCheck, Shield,
  Search, Bell, FileText, Settings, LayoutDashboard,
  ClipboardList, BookOpen
} from "lucide-react";
import { useLang, T } from "@/lib/i18n";
import { fmtInt, pctFormat } from "@/lib/utils";
import InfoTooltip from "./InfoTooltip";
import {
  LineChart as RechartsLineChart, Line, ResponsiveContainer
} from "recharts";

type Props = {
  recall: number;
  precision: number;
  criticalCount: number;
};

const CREDENTIALS = [
  { role: "Teacher", roleTE: "ఉపాధ్యాయుడు", email: "teacher@zphs.ap.gov.in", password: "teacher123" },
  { role: "Head Master", roleTE: "ప్రధానోపాధ్యాయుడు", email: "principal@zphs.ap.gov.in", password: "hm123" },
  { role: "District Officer", roleTE: "జిల్లా అధికారి", email: "deo@ntr.ap.gov.in", password: "district123" },
  { role: "School Education Dept.", roleTE: "పాఠశాల విద్యా శాఖ", email: "director@apsed.ap.gov.in", password: "sed123" },
];

const mockLineData = [
  { val: 65 }, { val: 68 }, { val: 60 }, { val: 72 }, { val: 85 }, { val: 78 }, { val: 90 }, { val: 82 }, { val: 95 }
];

const mockInterventionData = [
  { val: 10 }, { val: 15 }, { val: 12 }, { val: 20 }, { val: 18 }, { val: 25 }, { val: 22 }, { val: 30 }
];

export default function LandingClient({ recall, precision, criticalCount }: Props) {
  const { lang } = useLang();
  const t = T.landing;

  return (
    <div className="w-full bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-24">
      
      {/* 1. HERO SECTION */}
      <section className="max-w-[1400px] mx-auto px-6 pt-16 grid grid-cols-1 xl:grid-cols-12 gap-16 items-center mb-24">
        {/* Left Content */}
        <div className="xl:col-span-5 space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold tracking-wide uppercase">
            {t.heroTag[lang]}
          </div>
          
          <h1 className="text-[2.75rem] md:text-[3.25rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
            {lang === 'en' ? t.heroTitle1[lang] : <span className="text-[#0A2342]">{t.heroTitle1[lang]}</span>} <br/>
            {lang === 'en' ? <span className="text-[#0A2342]">{t.heroTitle2[lang]}</span> : t.heroTitle2[lang]}
          </h1>
          
          <p className="text-[17px] text-slate-600 max-w-lg leading-relaxed">
            {t.heroDesc[lang]}
          </p>

          {/* Micro-features Row */}
          <div className="flex gap-8 py-2">
            <div className="flex flex-col gap-2 w-20">
              <div className="h-10 w-10 text-blue-700 flex items-center justify-center">
                <Search className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{t.heroIdentify[lang].split(' ')[0]}</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{t.heroIdentify[lang].split(' ').slice(1).join(' ')}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-20">
              <div className="h-10 w-10 text-blue-700 flex items-center justify-center">
                <Bell className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{t.heroEnable[lang].split(' ')[0]}</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{t.heroEnable[lang].split(' ').slice(1).join(' ')}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-24">
              <div className="h-10 w-10 text-blue-700 flex items-center justify-center">
                <Users className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{t.heroEngage[lang].split(' ')[0]}</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{t.heroEngage[lang].split(' ').slice(1).join(' ')}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-24">
              <div className="h-10 w-10 text-blue-700 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{t.heroImprove[lang].split(' ')[0]}</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{t.heroImprove[lang].split(' ').slice(1).join(' ')}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <Link href="/login" className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-[#0A2342] text-white font-semibold hover:bg-blue-900 transition shadow-md shadow-blue-900/20">
              {t.exploreDash[lang]}
            </Link>
            <Link href="/overview" className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:text-blue-800 transition">
              {t.learnMore[lang]} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Dashboard Mockup */}
        <div className="xl:col-span-7 relative w-full aspect-[4/3] max-h-[550px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-20 lg:w-48 bg-[#1B2945] text-slate-400 flex flex-col pt-6 pb-4">
            <div className="px-5 mb-8 flex justify-center lg:justify-start">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white"><Shield className="h-4 w-4" /></div>
            </div>
            <div className="flex-1 space-y-2 px-3">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-white text-[#1B2945] rounded-lg cursor-pointer">
                <LayoutDashboard className="h-4 w-4" /> <span className="hidden lg:block text-[13px] font-bold">{t.dashRiskOver[lang]}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer">
                <Users className="h-4 w-4" /> <span className="hidden lg:block text-[13px] font-medium">{t.dashSchool[lang]}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer">
                <Bell className="h-4 w-4" /> <span className="hidden lg:block text-[13px] font-medium">{t.dashAlerts[lang]}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer">
                <HeartHandshake className="h-4 w-4" /> <span className="hidden lg:block text-[13px] font-medium">{t.dashInterventions[lang]}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer">
                <FileText className="h-4 w-4" /> <span className="hidden lg:block text-[13px] font-medium">{t.dashReports[lang]}</span>
              </div>
            </div>
            <div className="px-3">
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer">
                <Settings className="h-4 w-4" /> <span className="hidden lg:block text-[13px] font-medium">{t.dashSettings[lang]}</span>
              </div>
            </div>
          </div>
          
          {/* Main Dash Area */}
          <div className="flex-1 bg-slate-50 p-6 overflow-hidden flex flex-col gap-6">
            {/* Top Bar */}
            <div className="flex justify-between items-center bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-100">
               <div className="font-bold text-slate-800 text-sm">{t.dashRiskOver[lang]}</div>
               <div className="flex gap-3 text-xs">
                 <div className="flex items-center gap-2 text-slate-500">{t.dashSchool[lang]} <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">{t.dashAllDist[lang]}</span></div>
                 <div className="flex items-center gap-2 text-slate-500">{t.dashAcadYear[lang]} <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">2024-25</span></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 h-full pb-4">
               {/* At-Risk Identified */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
                  <div className="text-[11px] font-bold text-slate-800 mb-1">{t.dashAtRiskId[lang]}</div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{fmtInt(9117)}</div>
                  <div className="text-[10px] text-slate-500 mb-4">{t.dashAcrossAp[lang]}</div>
                  <div className="flex-1 min-h-[60px] -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={mockLineData}>
                        <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium flex items-center gap-1"><span className="text-emerald-500">{t.dashVsLastYr[lang].split(' ')[0]}</span> {t.dashVsLastYr[lang].split(' ').slice(1).join(' ')}</div>
               </div>

               {/* Risk Distribution */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
                  <div className="text-[11px] font-bold text-slate-800 mb-4">{t.dashRiskDist[lang]}</div>
                  <div className="flex items-center justify-between flex-1">
                     <div className="relative h-24 w-24">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
                           <circle cx="18" cy="18" r="15" fill="none" className="stroke-emerald-400" strokeWidth="6" strokeDasharray="100 100" />
                           <circle cx="18" cy="18" r="15" fill="none" className="stroke-amber-400" strokeWidth="6" strokeDasharray="50 100" strokeDashoffset="-50" />
                           <circle cx="18" cy="18" r="15" fill="none" className="stroke-red-500" strokeWidth="6" strokeDasharray="18 100" strokeDashoffset="-82" />
                        </svg>
                     </div>
                     <div className="space-y-2.5">
                       <div className="flex items-center justify-between gap-4 text-[11px]">
                         <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> {t.dashHighRisk[lang]}</span>
                         <span className="font-bold text-slate-700">18%</span>
                       </div>
                       <div className="flex items-center justify-between gap-4 text-[11px]">
                         <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> {t.dashMedRisk[lang]}</span>
                         <span className="font-bold text-slate-700">32%</span>
                       </div>
                       <div className="flex items-center justify-between gap-4 text-[11px]">
                         <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> {t.dashLowRisk[lang]}</span>
                         <span className="font-bold text-slate-700">50%</span>
                       </div>
                     </div>
                  </div>
               </div>

               {/* Top Risk Factors */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
                  <div className="text-[11px] font-bold text-slate-800 mb-4">{t.dashTopFactors[lang]}</div>
                  <div className="space-y-3.5 flex-1">
                     <div>
                        <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-700">{t.dashAttIrr[lang]}</span><span className="font-bold">42%</span></div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[42%]"></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-700">{t.dashLowAcad[lang]}</span><span className="font-bold">28%</span></div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 w-[28%]"></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-700">{t.dashSocioEcon[lang]}</span><span className="font-bold">18%</span></div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-400 w-[18%]"></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-700">{t.dashMigration[lang]}</span><span className="font-bold">12%</span></div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400 w-[12%]"></div></div>
                     </div>
                  </div>
               </div>

               {/* Intervention Impact */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
                  <div className="text-[11px] font-bold text-slate-800 mb-3">{t.dashImpact[lang]}</div>
                  <div className="text-[10px] text-slate-500">{t.dashSupported[lang]}</div>
                  <div className="text-xl font-bold text-slate-900 mb-2">6,245</div>
                  <div className="flex items-end justify-between flex-1">
                    <div>
                       <div className="text-[10px] text-slate-500">{t.dashDropRed[lang]}</div>
                       <div className="text-xl font-bold text-slate-900 mb-1">23%</div>
                       <div className="text-[9px] text-slate-400">{t.dashInLastYr[lang]}</div>
                    </div>
                    <div className="h-12 w-20">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsLineChart data={mockInterventionData}>
                           <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                         </RechartsLineChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. METRICS STRIP */}
      <section className="border-y border-slate-100 bg-[#F8FAFC]">
        <div className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="flex items-start gap-4">
             <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><Users className="h-5 w-5"/></div>
             <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">3,95,000+</div>
                <div className="text-[13px] font-medium text-slate-700">{t.studentsMonitored[lang]}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.ay[lang]}</div>
             </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><Database className="h-5 w-5"/></div>
             <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">9,149</div>
                <div className="text-[13px] font-medium text-slate-700">{t.schoolsCovered[lang]}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.across26[lang]}</div>
             </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg></div>
             <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">80%</div>
                <div className="text-[13px] font-medium text-slate-700">{t.dropoutRecall[lang]}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.shareCaught[lang]}</div>
             </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><Target className="h-5 w-5"/></div>
             <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">20%</div>
                <div className="text-[13px] font-medium text-slate-700">{t.statExclusionError[lang]}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.statRealDropoutsMissed[lang]}</div>
             </div>
          </div>
          <div className="flex items-start gap-4 col-span-2 md:col-span-1">
             <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5"/></div>
             <div>
                <div className="text-lg font-bold text-slate-900 leading-tight mb-1">{t.statSecureCompliant[lang].split('&')[0]} & <br/>{t.statSecureCompliant[lang].split('&')[1] || ''}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.statDataPrivacy[lang].substring(0, 20)} <br/> {t.statDataPrivacy[lang].substring(20)}</div>
             </div>
          </div>
        </div>
      </section>

      {/* 3. KEY FEATURES */}
      <section className="max-w-[1400px] mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">{t.featTitle[lang]}</h2>
          <p className="text-slate-500">{t.featSubtitle[lang]}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-md transition">
             <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5"><Brain className="h-6 w-6"/></div>
             <h3 className="font-bold text-slate-900 text-sm mb-3">{t.pillar1[lang].split(' ').slice(0,1).join(' ')}<br/>{t.pillar1[lang].split(' ').slice(1).join(' ')}</h3>
             <p className="text-[13px] text-slate-500 leading-relaxed">{t.feat1Desc[lang]}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-md transition">
             <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-5"><BarChart2 className="h-6 w-6"/></div>
             <h3 className="font-bold text-slate-900 text-sm mb-3">{t.pillar2[lang].split(' & ')[0]}<br/>& {t.pillar2[lang].split(' & ')[1]}</h3>
             <p className="text-[13px] text-slate-500 leading-relaxed">{t.feat2Desc[lang]}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-md transition">
             <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-5"><Users className="h-6 w-6"/></div>
             <h3 className="font-bold text-slate-900 text-sm mb-3">{t.pillar4[lang].split(' & ')[0]} &<br/>{t.pillar4[lang].split(' & ')[1]}</h3>
             <p className="text-[13px] text-slate-500 leading-relaxed">{t.feat3Desc[lang]}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-md transition">
             <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-5"><Plug className="h-6 w-6"/></div>
             <h3 className="font-bold text-slate-900 text-sm mb-3">{t.feat4Title[lang].split(' with ')[0]}<br/>with {t.feat4Title[lang].split(' with ')[1]}</h3>
             <p className="text-[13px] text-slate-500 leading-relaxed">{t.feat4Desc[lang]}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-md transition">
             <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-5"><ShieldCheck className="h-6 w-6"/></div>
             <h3 className="font-bold text-slate-900 text-sm mb-3">{t.feat5Title[lang].split('-')[0]}-{t.feat5Title[lang].split('-')[1]?.split(' ')[0]}<br/>{t.feat5Title[lang].split(' ').slice(1).join(' ')}</h3>
             <p className="text-[13px] text-slate-500 leading-relaxed">{t.feat5Desc[lang]}</p>
          </div>
        </div>
      </section>

      {/* 4. DATA SOURCES & IMPACT (Side by Side) */}
      <section className="bg-[#F8FAFC] py-24">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
           {/* Left: Built on Trusted Data Sources */}
           <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-10">{t.dataSourcesTitle[lang]}</h2>
              <div className="space-y-8">
                 <div className="flex gap-5">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0"><ClipboardList className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-1">{t.ds1Title[lang]}</h4>
                       <p className="text-sm text-slate-500">{t.ds1Sub[lang]}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Users className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-1">{t.ds2Title[lang]}</h4>
                       <p className="text-sm text-slate-500">{t.ds2Sub[lang]}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><BookOpen className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-1">{t.ds3Title[lang]}</h4>
                       <p className="text-sm text-slate-500">{t.ds3Sub[lang]}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0"><TrendingUp className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-1">{t.ds4Title[lang]}</h4>
                       <p className="text-sm text-slate-500">{t.ds4Sub[lang]}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0"><LayoutDashboard className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-1">{t.ds5Title[lang]}</h4>
                       <p className="text-sm text-slate-500">{t.ds5Sub[lang]}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right: Expected Impact */}
           <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-10">{t.impactTitle[lang]}</h2>
              <div className="space-y-10">
                 <div className="flex gap-5">
                    <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><UserCheck className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-2 text-blue-800">{t.imp1Title[lang]}</h4>
                       <p className="text-sm text-slate-600 leading-relaxed">{t.imp1Desc[lang]}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><HeartHandshake className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-2 text-blue-800">{t.imp2Title[lang]}</h4>
                       <p className="text-sm text-slate-600 leading-relaxed">{t.imp2Desc[lang]}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <div className="h-14 w-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><LayoutDashboard className="h-6 w-6"/></div>
                    <div>
                       <h4 className="font-bold text-slate-900 text-[15px] mb-2 text-blue-800">{t.imp3Title[lang]}</h4>
                       <p className="text-sm text-slate-600 leading-relaxed">{t.imp3Desc[lang]}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 5. BOTTOM VALUES STRIP */}
      <section className="max-w-[1400px] mx-auto px-6 py-16 border-b border-slate-100">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="flex items-start gap-4 pt-6 md:pt-0 md:pr-6">
               <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Bell className="h-5 w-5"/></div>
               <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{t.val1Title[lang]}</h4>
                  <p className="text-xs text-slate-500">{t.val1Desc[lang]}</p>
               </div>
            </div>
            <div className="flex items-start gap-4 pt-6 md:pt-0 md:px-6">
               <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Activity className="h-5 w-5"/></div>
               <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{t.val2Title[lang]}</h4>
                  <p className="text-xs text-slate-500">{t.val2Desc[lang]}</p>
               </div>
            </div>
            <div className="flex items-start gap-4 pt-6 md:pt-0 md:px-6">
               <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5"/></div>
               <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{t.val3Title[lang]}</h4>
                  <p className="text-xs text-slate-500">{t.val3Desc[lang]}</p>
               </div>
            </div>
            <div className="flex items-start gap-4 pt-6 md:pt-0 md:pl-6">
               <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0"><Target className="h-5 w-5"/></div>
               <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{t.val4Title[lang]}</h4>
                  <p className="text-xs text-slate-500">{t.val4Desc[lang]}</p>
               </div>
            </div>
         </div>
      </section>

      {/* 6. FOOTER CHALLENGE */}
      <section className="text-center py-16">
         <p className="text-slate-600 text-sm mb-2">{t.valFooter1[lang]}</p>
         <h2 className="text-2xl font-bold text-blue-900">{t.valFooter2[lang]}</h2>
      </section>

    </div>
  );
}

