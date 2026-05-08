"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, Lock, Eye, Users, CheckCircle2, X } from "lucide-react";

const CONSENT_KEY = "ap_guardian_consent_v1";

export default function ConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show only if user hasn't consented yet
    const consented = localStorage.getItem(CONSENT_KEY);
    if (!consented) setOpen(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-[color:var(--ap-navy)] to-blue-700 rounded-t-2xl px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="h-6 w-6 text-white shrink-0" />
            <h2 className="text-lg font-bold text-white">Data Privacy & Usage Notice</h2>
          </div>
          <p className="text-blue-200 text-sm">
            AP Dropout Guardian — DPDP Act 2023 Compliance
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-700 leading-relaxed">
            This system processes student data to identify dropout risk. Before proceeding,
            please review how your data is used and protected.
          </p>

          <div className="space-y-3">
            {[
              {
                icon: <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
                title: "Anonymised at source",
                desc: "Aadhaar numbers are hashed (SHA-256 + salt) at ingestion. Raw PII is never stored in the model pipeline or displayed in any browser interface.",
              },
              {
                icon: <Eye className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
                title: "Role-scoped access",
                desc: "You can only view data within your authorised scope — teachers see their school only; district officers see mandal-level aggregates.",
              },
              {
                icon: <Users className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />,
                title: "Human-in-the-loop",
                desc: "The AI model flags students for review only. All interventions require your explicit sign-off — the system never acts automatically.",
              },
              {
                icon: <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
                title: "Audit trail",
                desc: "All data access and intervention actions are logged with your identity, timestamp, and action type for accountability and compliance review.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
                {item.icon}
                <div>
                  <div className="text-sm font-semibold text-zinc-800 mb-0.5">{item.title}</div>
                  <div className="text-xs text-zinc-600 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <strong>Data retention:</strong> Student records are retained for 7 years per the DPDP Act 2023.
            Requests for data correction or deletion can be directed to the State Education Dept. DPDP Officer.
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            By clicking "I Understand & Proceed", you confirm that you are an authorised
            government education official and agree to use this system only for its intended
            purpose: identifying and supporting at-risk students. Misuse of student data
            is prohibited under the DPDP Act 2023 and may attract civil/criminal liability.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-[color:var(--ap-navy)] text-white text-sm font-semibold py-3 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            I Understand & Proceed
          </button>
        </div>

      </div>
    </div>
  );
}
