"use client";
import { useState } from "react";
import { Phone, MessageCircle, UserCheck, MapPin, CreditCard, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, T } from "@/lib/i18n";

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
          {T.community.title[lang]}
        </h2>
        <span className="text-[10px] uppercase tracking-wide bg-white border border-emerald-200 text-emerald-700 rounded px-2 py-0.5 font-medium">
          {T.community.actionRequired[lang]}
        </span>
      </div>

      {/* Parent & household info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <Phone className="h-3 w-3" />
            {T.community.parent[lang]}
          </div>
          <div className="text-sm font-medium text-zinc-800">{parentName}</div>
          <div className="text-xs text-zinc-600 font-mono mt-0.5">{phone}</div>
        </div>
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" />
            {T.community.distance[lang]}
          </div>
          <div className="text-sm font-medium text-zinc-800">{distanceKm.toFixed(1)} km</div>
          <div className="text-xs text-zinc-500">{distanceKm > 5 ? T.community.transportNeeded[lang] : T.community.walkable[lang]}</div>
        </div>
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <CreditCard className="h-3 w-3" />
            {T.community.rationCard[lang]}
          </div>
          <div className={cn("text-sm font-medium", rationCard ? "text-emerald-700" : "text-red-700")}>
            {rationCard ? T.community.active[lang] : T.community.notRegistered[lang]}
          </div>
          <div className="text-xs text-zinc-500">{lang === "en" ? "Civil Supplies DB" : "సివిల్ సరఫరాల DB"}</div>
        </div>
        <div className="rounded-lg bg-white border p-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
            <UserCheck className="h-3 w-3" />
            {T.community.volunteer[lang]}
          </div>
          <div className="text-xs font-medium text-zinc-800 leading-tight">{volunteer}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="rounded-lg bg-white border p-4 space-y-3">
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
          {T.community.outreach[lang]}
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
            {whatsappSent ? T.community.whatsappSent[lang] : T.community.whatsapp[lang]}
          </button>
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition"
          >
            <Phone className="h-4 w-4" />
            {T.community.call[lang]}
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
            {contacted ? T.community.contacted[lang] : T.community.markContacted[lang]}
          </button>
        </div>
        <p className="text-[11px] text-zinc-400">
          {T.community.contactLog[lang]}
        </p>
      </div>

      {/* Scheme eligibility quick-check */}
      {!rationCard && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">{lang === "en" ? "Action: " : "చర్య: "}</span>
          {T.community.rationAlert[lang]}
        </div>
      )}
    </section>
  );
}
