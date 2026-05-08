import { getMetrics, getMandals } from "@/lib/data";
import { pctFormat, fmtInt } from "@/lib/utils";
import {
  Users, AlertTriangle, TrendingDown, MapPin, Heart,
  CheckCircle2, PhoneCall, BookOpen, ShieldCheck, Info,
} from "lucide-react";

export default async function CommunityReportPage() {
  const [m, mandals] = await Promise.all([getMetrics(), getMandals()]);
  const t = m.test_oot;

  const totalStudents = Object.values(m.tier_counts).reduce((a, b) => a + b, 0);
  const atRisk = m.tier_counts.Critical + m.tier_counts.High + m.tier_counts.Medium;
  const criticalHigh = m.tier_counts.Critical + m.tier_counts.High;

  // Top 5 mandals by absolute flagged count
  const topMandals = [...mandals]
    .filter((mn) => mn.n_flagged > 0)
    .sort((a, b) => b.n_flagged - a.n_flagged)
    .slice(0, 5);

  const interventionTypes = [
    { icon: "🏠", label: "Home Visit", desc: "Community volunteers visit at-risk families to understand barriers and offer reassurance." },
    { icon: "📞", label: "Parent Counselling", desc: "Trained NGO counsellors meet parents to address economic pressures, misconceptions, and alternatives." },
    { icon: "💰", label: "Financial Aid Referral", desc: "Link families to government schemes: Amma Vodi, Post-Matric Scholarship, NTR Vidyonnathi." },
    { icon: "🚌", label: "Transport Support", desc: "Facilitate transport allowance applications for students at distance-barrier risk." },
    { icon: "📚", label: "Bridge Tutoring", desc: "Community learning centres offer after-school academic support to prevent performance-driven dropout." },
    { icon: "🤝", label: "Peer Mentorship", desc: "Connect at-risk students with successful peers from similar backgrounds as role models." },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-emerald-100 p-3 shrink-0">
            <Heart className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Community & NGO Report</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Aggregate district overview for community leaders, NGOs, and civil society partners.
              No individual student data is shown — all figures are anonymised population-level statistics.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> No student PII exposed
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1 font-medium">
                <Info className="h-3.5 w-3.5" /> 2024-25 Academic Year
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-center">
          <Users className="h-5 w-5 text-zinc-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-zinc-900 tabular-nums">{fmtInt(totalStudents)}</div>
          <div className="text-xs text-zinc-500 font-medium mt-0.5">Total students monitored</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
          <div className="text-2xl font-black text-amber-900 tabular-nums">{fmtInt(atRisk)}</div>
          <div className="text-xs text-amber-700 font-medium mt-0.5">Flagged at-risk ({pctFormat(atRisk / totalStudents, 1)})</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center">
          <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
          <div className="text-2xl font-black text-red-900 tabular-nums">{fmtInt(criticalHigh)}</div>
          <div className="text-xs text-red-700 font-medium mt-0.5">Critical + High priority</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <div className="text-2xl font-black text-emerald-900 tabular-nums">{pctFormat(t.recall, 1)}</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">Dropout detection rate</div>
        </div>
      </div>

      {/* Risk tier breakdown */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">Student risk distribution</h2>
        <div className="space-y-3">
          {[
            { label: "Critical risk (≥85%)", count: m.tier_counts.Critical, total: totalStudents, color: "bg-red-500", badge: "bg-red-100 text-red-800" },
            { label: "High risk (65–85%)", count: m.tier_counts.High, total: totalStudents, color: "bg-orange-400", badge: "bg-orange-100 text-orange-800" },
            { label: "Medium risk (51–65%)", count: m.tier_counts.Medium, total: totalStudents, color: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800" },
            { label: "Low / Monitoring (≤50%)", count: m.tier_counts.Low, total: totalStudents, color: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-800" },
          ].map((tier) => (
            <div key={tier.label} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-sm text-zinc-700">{tier.label}</div>
              <div className="flex-1 h-5 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${tier.color} transition-all`}
                  style={{ width: `${(tier.count / tier.total) * 100}%` }}
                />
              </div>
              <div className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${tier.badge}`}>
                {fmtInt(tier.count)} ({pctFormat(tier.count / tier.total, 1)})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fairness / equity */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-1 flex items-center gap-2">
          Equity audit — detection rate by subgroup
          <Info className="h-4 w-4 text-zinc-400" />
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          The AI model is independently validated to detect dropout risk equally across marginalised groups.
          Subgroups with recall &lt; 75% are flagged for model review.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {m.fairness.map((row) => (
            <div key={row.group} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-800">{row.group}</div>
                <div className="text-xs text-zinc-500">{fmtInt(row.n)} students · {fmtInt(row.pos)} at-risk</div>
              </div>
              <div className="text-right shrink-0">
                {row.recall === null ? (
                  <span className="text-xs text-zinc-400">—</span>
                ) : (
                  <>
                    <div className={`text-lg font-black tabular-nums ${row.recall >= 0.75 ? "text-emerald-700" : "text-amber-700"}`}>
                      {pctFormat(row.recall, 1)}
                    </div>
                    <div className="text-[10px] text-zinc-400">detection rate</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic hotspots */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-1 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[color:var(--ap-navy)]" />
          Geographic hotspots — top mandals by at-risk count
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          NGOs and community groups can prioritise outreach efforts in these mandals.
        </p>
        <div className="space-y-2">
          {topMandals.map((mn, i) => (
            <div key={`${mn.mandal_name}-${i}`} className="flex items-center gap-3 rounded-lg bg-zinc-50 border border-zinc-100 px-4 py-3">
              <div className="w-6 h-6 rounded-full bg-[color:var(--ap-navy)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-800 text-sm truncate">{mn.mandal_name ?? "Unknown"}</div>
                <div className="text-xs text-zinc-500">{mn.district_name ?? "—"} district · {fmtInt(mn.n_students)} students</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-amber-700 tabular-nums">{fmtInt(mn.n_flagged)}</div>
                <div className="text-[10px] text-zinc-400">at-risk</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intervention types NGOs can help with */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-1 flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-[color:var(--ap-navy)]" />
          How community partners can help
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          NGOs and community leaders can request referrals from school teachers for at-risk students.
          Below are the intervention types the system tracks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {interventionTypes.map((iv) => (
            <div key={iv.label} className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="text-2xl shrink-0">{iv.icon}</div>
              <div>
                <div className="text-sm font-semibold text-zinc-800 mb-0.5">{iv.label}</div>
                <div className="text-xs text-zinc-600 leading-relaxed">{iv.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key government schemes */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Government schemes available for at-risk students
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "Amma Vodi", benefit: "₹15,000/year cash incentive to mothers whose children attend school regularly." },
            { name: "Post-Matric Scholarship (RTF+MTF)", benefit: "Full tuition + maintenance allowance for SC/ST/OBC/EWS students in classes 9–12." },
            { name: "NTR Vidyonnathi", benefit: "Free coaching and financial support for competitive exam preparation for underprivileged students." },
            { name: "Jagananna Vidya Deevena", benefit: "Full fee reimbursement for higher education for eligible families (income ≤ ₹2.5L/year)." },
            { name: "Transport Allowance", benefit: "Monthly transport allowance for students living >1 km from school (administered via Samagra Shiksha)." },
            { name: "Mid-Day Meal Scheme", benefit: "Free nutritious meals at school — reduces economic burden and incentivises attendance." },
          ].map((scheme) => (
            <div key={scheme.name} className="rounded-lg border border-blue-200 bg-white px-4 py-3">
              <div className="text-sm font-semibold text-blue-900 mb-1">{scheme.name}</div>
              <div className="text-xs text-zinc-600 leading-relaxed">{scheme.benefit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer notice */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-xs text-zinc-500 leading-relaxed">
        <strong className="text-zinc-700">Data privacy notice:</strong> This report contains only aggregate, anonymised statistics.
        No individual student names, Aadhaar numbers, or identifiable information is included.
        School-level and student-level data requires official role-based access.
        Community partners wishing to collaborate on student support should contact the district education office.
      </div>
    </div>
  );
}
