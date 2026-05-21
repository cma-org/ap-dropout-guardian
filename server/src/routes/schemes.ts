import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getOpenAI(): OpenAI {
  const key = process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI API key not configured");
  return new OpenAI({ apiKey: key });
}

export const ALL_SCHEMES = [
  {
    id: "kgbv",
    emoji: "🏠",
    name: "Kasturba Gandhi Balika Vidyalayas (KGBVs)",
    benefit: "Free residential schooling, food and health support for disadvantaged girls aged 10–18 (Classes VI–XII) from SC, ST, OBC, minority and BPL families.",
  },
  {
    id: "transport",
    emoji: "🚌",
    name: "Transport / Escort Facility",
    benefit: "Free transport and escort up to Class X for children in remote habitations where opening a school is unviable or the Gross Access Ratio is low.",
  },
  {
    id: "uniforms_textbooks",
    emoji: "📚",
    name: "Free Uniforms & Textbooks",
    benefit: "Free uniforms and textbooks for eligible children at the elementary level under the RTE Act / Samagra Shiksha.",
  },
  {
    id: "special_training",
    emoji: "🧑‍🎓",
    name: "Special Training for Out-of-School Children",
    benefit: "Age-appropriate admission and bridge training so older children who missed school years can re-enter the correct class.",
  },
  {
    id: "cwsn",
    emoji: "🧒",
    name: "Support for Children with Special Needs (CWSN)",
    benefit: "Early identification, resource support and full participation for children with disabilities in the school education system.",
  },
  {
    id: "osc_drive",
    emoji: "🔍",
    name: "OSC Enrollment Drive",
    benefit: "One-month door-to-door campaign to identify and enroll all school-age children aged 6–14 years — targeting 100% enrollment and zero dropout.",
  },
  {
    id: "sports_grant",
    emoji: "🏋️",
    name: "Sports & Physical Education Grant",
    benefit: "Up to ₹25,000 school sports grant when students win medals at Khelo India School Games — keeps students engaged and motivated.",
  },
  {
    id: "fln",
    emoji: "📖",
    name: "Foundational Literacy & Numeracy (FLN)",
    benefit: "Ensures every child can read, write and do basic arithmetic — addresses learning gaps that are a key driver of early dropout.",
  },
  {
    id: "vocational",
    emoji: "🎓",
    name: "Vocational Education",
    benefit: "Skills and vocational training for students and dropouts — builds employable skills and reduces economic pressure that leads to leaving school early.",
  },
  {
    id: "smc",
    emoji: "👨‍👩‍👧",
    name: "School Management Committees (Parent Involvement)",
    benefit: "Active community and parental participation through SMCs under Section 21 RTE Act to monitor children's education and improve retention.",
  },
];

function getRuleBasedIds(body: Record<string, unknown>): string[] {
  const {
    gender_label,
    migration_flag,
    attendance_rate,
    fa_avg,
    sa_avg,
    family_income_bracket,
    transport_allowance,
    parent_literacy,
    tier,
  } = body as {
    gender_label?: string;
    migration_flag?: number | boolean;
    attendance_rate?: number;
    fa_avg?: number | null;
    sa_avg?: number | null;
    family_income_bracket?: number;
    transport_allowance?: number | boolean;
    parent_literacy?: number;
    tier?: string;
  };

  const ids: string[] = [];

  if (gender_label === "Female") ids.push("kgbv");
  if (!transport_allowance) ids.push("transport");
  ids.push("uniforms_textbooks");

  if (migration_flag || (attendance_rate != null && attendance_rate < 0.6)) {
    ids.push("special_training");
    ids.push("osc_drive");
  }

  if (parent_literacy != null && parent_literacy <= 1) ids.push("smc");

  if ((fa_avg != null && fa_avg < 150) || (sa_avg != null && sa_avg < 150)) {
    ids.push("fln");
  }

  if (tier === "Critical" || tier === "High") {
    ids.push("osc_drive");
    ids.push("vocational");
  }

  if (family_income_bracket != null && family_income_bracket <= 2) {
    ids.push("vocational");
    ids.push("fln");
  }

  return [...new Set(ids)].slice(0, 6);
}

// POST /api/schemes/recommend
router.post("/recommend", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const {
      drivers = [],
      gender_label,
      migration_flag,
      attendance_rate,
      fa_avg,
      sa_avg,
      family_income_bracket,
      transport_allowance,
      parent_literacy,
      tier,
    } = body as {
      drivers?: { feature: string; contrib: number }[];
      gender_label?: string;
      migration_flag?: number;
      attendance_rate?: number;
      fa_avg?: number | null;
      sa_avg?: number | null;
      family_income_bracket?: number;
      transport_allowance?: number;
      parent_literacy?: number;
      tier?: string;
    };

    const topDrivers = (drivers as { feature: string; contrib: number }[])
      .slice(0, 5)
      .map((d) => `${d.feature} (${(d.contrib * 100).toFixed(1)}%)`)
      .join(", ");

    const studentSummary = [
      `Risk tier: ${tier ?? "unknown"}`,
      `Gender: ${gender_label ?? "unknown"}`,
      attendance_rate != null ? `Attendance: ${(attendance_rate * 100).toFixed(1)}%` : null,
      fa_avg != null ? `FA marks: ${fa_avg}/300` : null,
      sa_avg != null ? `SA marks: ${sa_avg}/300` : null,
      `Seasonal migration: ${migration_flag ? "Yes" : "No"}`,
      family_income_bracket != null
        ? `Family income bracket: ${family_income_bracket} (1=very low, 5=high)`
        : null,
      `Has transport allowance: ${transport_allowance ? "Yes" : "No"}`,
      parent_literacy != null
        ? `Parent literacy: ${parent_literacy} (0=none, 2=literate)`
        : null,
      topDrivers ? `Top dropout drivers: ${topDrivers}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const schemeMenu = ALL_SCHEMES.map(
      (s, i) => `${i + 1}. id="${s.id}" | ${s.name}: ${s.benefit}`
    ).join("\n");

    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an Andhra Pradesh government education welfare officer. Given a student's dropout risk profile, select the 4–6 most relevant government schemes from the provided list. Respond ONLY with a JSON object: {\"scheme_ids\": [\"id1\", \"id2\", ...]}",
          },
          {
            role: "user",
            content: `Student profile:\n${studentSummary}\n\nAvailable schemes:\n${schemeMenu}\n\nSelect the 4–6 most relevant scheme IDs for this student.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 150,
        temperature: 0.1,
      });

      const parsed = JSON.parse(
        completion.choices[0].message.content ?? "{}"
      ) as { scheme_ids?: string[]; schemes?: string[]; ids?: string[] };

      const aiIds: string[] = parsed.scheme_ids ?? parsed.schemes ?? parsed.ids ?? [];
      const valid = ALL_SCHEMES.map((s) => s.id);
      const recommended = aiIds
        .filter((id) => valid.includes(id))
        .map((id) => ALL_SCHEMES.find((s) => s.id === id)!)
        .filter(Boolean)
        .slice(0, 6);

      if (recommended.length >= 3) {
        res.json({ schemes: recommended, source: "ai" });
        return;
      }
    } catch {
      // fall through to rule-based
    }

    // Rule-based fallback
    const fallbackIds = getRuleBasedIds(body);
    const fallback = fallbackIds
      .map((id) => ALL_SCHEMES.find((s) => s.id === id))
      .filter(Boolean) as typeof ALL_SCHEMES;

    res.json({ schemes: fallback, source: "rules" });
  } catch (err) {
    console.error("Schemes recommend error:", err);
    res.status(500).json({ error: "Failed to recommend schemes" });
  }
});

export default router;
