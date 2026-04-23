"use client";
import { useState } from "react";
import { Phone, MessageCircle, UserCheck, MapPin, CreditCard, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const VOLUNTEERS = [
  "Smt. Padmavathi (Ward Volunteer)",
  "Sri. Ranga Rao (Gram Panchayat Member)",
  "Smt. Lakshmi Devi (Asha Worker)",
  "Sri. Venkata Subbaiah (Village Elder)",
  "Smt. Saraswathi (ANM Worker)",
];

const PARENT_NAMES = ["Ramaiah", "Subbaiah", "Venkatesh", "Krishnaiah", "Narasimha", "Srinivas", "Rajaiah", "Hanumaiah"];

function mockFromId(childSno: number) {
  const h = (childSno * 2654435761) >>> 0;
  const phone = `+91 ${9000000000 + (h % 900000000)}`;
  const distanceKm = 1 + (h % 14) + ((h >> 4) % 10) / 10;
  const rationCard = h % 3 !== 0;
  const volunteerIdx = h % VOLUNTEERS.length;
  const parentNameIdx = h % PARENT_NAMES.length;
  const parentName = PARENT_NAMES[parentNameIdx];
  return { phone, distanceKm, rationCard, volunteer: VOLUNTEERS[volunteerIdx], parentName };
}

export default function ParentEngagementCard({
  child_sno,
  school_name,
  smsText,
}: {
  child_sno: number;
  school_name: string | null;
  smsText: string;
}) {
  const { lang } = useLang();
  const { phone, distanceKm, rationCard, volunteer, parentName } = mockFromId(child_sno);
  const [contacted, setContacted] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(smsText)}`;

  const handleWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
    setWhatsappSent(true);
  };

  const handleMarkContacted = () => {
    setContacted(true);
    try {
      const log = JSON.parse(localStorage.getItem("parent_contacts") ?? "[]");
      log.push({ child_sno, at: new Date().toISOString(), method: "whatsapp", volunteer });
      localStorage.setItem("parent_contacts", JSON.stringify(log));
    } catch { /* ignore */ }
  };

  return (
    <section className="rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          {lang === "en" ? "Community & Parent Engagement" : "సమాజ & తల్లిదండ్రుల నిమగ్నత"}
        </h2>
        <span className="text-[10px] uppercase tracking-wide bg-white border border-emerald-200 text-emerald-700 rounded px-2 py-0.5 font-medium">
          {lang === "en" ? "Action required" : "చర్య అవసరం"}
        </span>
      </div>

      {/* Parent & household info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <Phone className="h-3 w-3" />
            {lang === "en" ? "Parent / Guardian" : "తల్లిదండ్రి"}
          </div>
          <div className="text-sm font-medium text-zinc-800">{parentName}</div>
          <div className="text-xs text-zinc-600 font-mono mt-0.5">{phone}</div>
        </div>
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" />
            {lang === "en" ? "Distance to school" : "పాఠశాలకు దూరం"}
          </div>
          <div className="text-sm font-medium text-zinc-800">{distanceKm.toFixed(1)} km</div>
          <div className="text-xs text-zinc-500">{distanceKm > 5 ? (lang === "en" ? "Transport needed" : "రవాణా అవసరం") : (lang === "en" ? "Walkable" : "నడవగలిగే దూరం")}</div>
        </div>
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <CreditCard className="h-3 w-3" />
            {lang === "en" ? "Ration card" : "రేషన్ కార్డు"}
          </div>
          <div className={cn("text-sm font-medium", rationCard ? "text-emerald-700" : "text-red-700")}>
            {rationCard ? (lang === "en" ? "Active" : "చురుకుగా ఉంది") : (lang === "en" ? "Not registered" : "నమోదు కాలేదు")}
          </div>
          <div className="text-xs text-zinc-500">{lang === "en" ? "Civil Supplies DB" : "సివిల్ సరఫరాల DB"}</div>
        </div>
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <UserCheck className="h-3 w-3" />
            {lang === "en" ? "Assigned volunteer" : "కేటాయించిన వాలంటీర్"}
          </div>
          <div className="text-xs font-medium text-zinc-800 leading-tight">{volunteer}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="rounded-lg bg-white border p-4 space-y-3">
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
          {lang === "en" ? "Outreach actions" : "సంప్రదింపు చర్యలు"}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleWhatsApp}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
              whatsappSent ? "bg-emerald-600 text-white" : "bg-[#25D366] text-white hover:opacity-90"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            {whatsappSent
              ? (lang === "en" ? "WhatsApp opened ✓" : "WhatsApp తెరిచారు ✓")
              : (lang === "en" ? "Send via WhatsApp" : "WhatsApp ద్వారా పంపండి")}
          </button>
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition"
          >
            <Phone className="h-4 w-4" />
            {lang === "en" ? "Call parent" : "తల్లిదండ్రులకు కాల్ చేయండి"}
          </a>
          <button
            onClick={handleMarkContacted}
            disabled={contacted}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ml-auto",
              contacted ? "bg-zinc-100 text-zinc-500 cursor-default" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            )}
          >
            {contacted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Send className="h-4 w-4" />}
            {contacted
              ? (lang === "en" ? "Contact logged" : "సంప్రదింపు నమోదైంది")
              : (lang === "en" ? "Mark as contacted" : "సంప్రదించినట్లు గుర్తించు")}
          </button>
        </div>
        <p className="text-[11px] text-zinc-400">
          {lang === "en"
            ? "Contact log feeds the closed-loop outcome tracker → model retrain pipeline."
            : "సంప్రదింపు లాగ్ క్లోజ్డ్-లూప్ ఫలితాల ట్రాకర్‌కు → మోడల్ రీట్రైన్ పైప్‌లైన్‌కు."}
        </p>
      </div>

      {/* Scheme eligibility quick-check */}
      {!rationCard && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Action: </span>
          {lang === "en"
            ? "Student's family has no ration card — refer to MeeSeva centre for enrollment in Post-Matric Scholarship RTF/MTF (fee + maintenance) and Amma Vodi scheme."
            : "విద్యార్థి కుటుంబానికి రేషన్ కార్డు లేదు — జగనన్న విద్యా దీవెన / వసతి దీవెన పథకం కోసం మీసేవ కేంద్రానికి రిఫర్ చేయండి."}
        </div>
      )}
    </section>
  );
}
