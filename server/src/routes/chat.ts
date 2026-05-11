import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";

const router = Router();

function getOpenAI(): OpenAI {
  const key = process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI API key not configured (set OPEN_API_KEY or OPENAI_API_KEY)");
  return new OpenAI({ apiKey: key });
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

function pct(n: number, decimals = 1) {
  return `${(n * 100).toFixed(decimals)}%`;
}

// ── server-side data aggregation ───────────────────────────────────────────

async function fetchLiveData(opts: {
  role: string;
  userSchoolName?: string;
  userDistrict?: string;
  userGrade?: number;
}): Promise<string> {
  const [schools, mandals, metricsRow] = await Promise.all([
    prisma.school.findMany({ orderBy: { schoolName: "asc" } }),
    prisma.mandal.findMany(),
    prisma.metrics.findFirst({ where: { version: "default" } }),
  ]);

  const lines: string[] = [];

  const totalStudents = schools.reduce((a, s) => a + (s.nStudents ?? 0), 0);
  const totalFlagged = schools.reduce((a, s) => a + (s.nFlagged ?? 0), 0);
  const overallAvgRisk =
    schools.length > 0
      ? schools.reduce((a, s) => a + (s.avgRisk ?? 0), 0) / schools.length
      : 0;

  // ── Role-specific highlighted data ──────────────────────────────────────

  // Teacher: class/grade-level data from RosterStudent
  if (opts.role === "teacher" && opts.userSchoolName && opts.userGrade != null) {
    const school = schools.find(
      (s) => s.schoolName?.toLowerCase() === opts.userSchoolName!.toLowerCase()
    );
    if (school) {
      const roster = await prisma.rosterStudent.findMany({
        where: { schoolId: school.schoolId, grade: opts.userGrade },
      });
      if (roster.length > 0) {
        const nFlagged = roster.filter((r) => r.tier !== "Low").length;
        const tiers: Record<string, number> = {};
        for (const r of roster) {
          tiers[r.tier] = (tiers[r.tier] ?? 0) + 1;
        }
        const avgRisk = roster.reduce((a, r) => a + r.riskScore, 0) / roster.length;
        const avgAtt = roster.reduce((a, r) => a + r.attendanceRate, 0) / roster.length;
        const lowAtt = roster.filter((r) => r.attendanceRate < 0.75).length;

        const flaggedStudents = roster.filter((r) => r.tier !== "Low").map((r) => r.childSno);
        let topDrivers: { label: string; count: number }[] = [];
        if (flaggedStudents.length > 0) {
          const drivers = await prisma.driver.findMany({
            where: { childSno: { in: flaggedStudents } },
          });
          const driverCount = new Map<string, number>();
          for (const d of drivers) {
            const key = d.labelEn || d.feature;
            driverCount.set(key, (driverCount.get(key) ?? 0) + 1);
          }
          topDrivers = [...driverCount.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }

        lines.push(`=== YOUR CLASS — Grade ${opts.userGrade} at ${school.schoolName} ===`);
        lines.push(`  Students in class: ${fmt(roster.length)}`);
        lines.push(`  Flagged at-risk: ${fmt(nFlagged)} (${pct(nFlagged / roster.length)})`);
        lines.push(`  Avg risk score: ${pct(avgRisk)}`);
        lines.push(`  Avg attendance rate: ${pct(avgAtt)}`);
        lines.push(`  Students with low attendance (<75%): ${fmt(lowAtt)}`);
        const tierStr = Object.entries(tiers)
          .map(([t, c]) => `${t}: ${c}`)
          .join(", ");
        lines.push(`  Tier distribution: ${tierStr}`);
        if (topDrivers.length > 0) {
          lines.push(`  Top dropout reasons in your class:`);
          for (const d of topDrivers) {
            lines.push(`    ${d.label}: ${d.count} students`);
          }
        }
        lines.push(`=== END OF YOUR CLASS ===\n`);
      }
    }
  }

  // HM: school-level data
  if (opts.role === "hm" && opts.userSchoolName) {
    const school = schools.find(
      (s) => s.schoolName?.toLowerCase() === opts.userSchoolName!.toLowerCase()
    );
    if (school) {
      lines.push(`=== YOUR SCHOOL: ${school.schoolName} ===`);
      lines.push(`  Students: ${fmt(school.nStudents ?? 0)}, Flagged: ${fmt(school.nFlagged ?? 0)} (${school.nStudents ? pct((school.nFlagged ?? 0) / school.nStudents) : "N/A"})`);
      lines.push(`  Avg dropout risk: ${pct(school.avgRisk ?? 0)}, Critical pct: ${pct(school.pctCritical ?? 0)}`);
      lines.push(`  District: ${school.districtName ?? "?"}`);

      // Grade-level breakdown for HM (if data available)
      const rosterByGrade = await prisma.rosterStudent.groupBy({
        by: ["grade"],
        where: { schoolId: school.schoolId, grade: { not: null } },
        _count: { childSno: true },
        _avg: { riskScore: true, attendanceRate: true },
      });
      if (rosterByGrade.length > 0) {
        lines.push(`  Grade-wise breakdown:`);
        for (const g of rosterByGrade.sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0))) {
          lines.push(`    Grade ${g.grade}: ${g._count.childSno} students, avg risk ${pct(g._avg.riskScore ?? 0)}, avg attendance ${pct(g._avg.attendanceRate ?? 0)}`);
        }
      }
      lines.push(`=== END OF YOUR SCHOOL ===\n`);
    } else {
      lines.push(`(Note: school "${opts.userSchoolName}" not found in database)\n`);
    }
  }

  // District: district-level data
  if (opts.role === "district" && opts.userDistrict) {
    const distSchools = schools.filter(
      (s) => s.districtName?.toLowerCase() === opts.userDistrict!.toLowerCase()
    );
    if (distSchools.length > 0) {
      const dStudents = distSchools.reduce((a, s) => a + (s.nStudents ?? 0), 0);
      const dFlagged = distSchools.reduce((a, s) => a + (s.nFlagged ?? 0), 0);
      const dAvgRisk = distSchools.reduce((a, s) => a + (s.avgRisk ?? 0), 0) / distSchools.length;
      lines.push(`=== YOUR DISTRICT: ${opts.userDistrict} ===`);
      lines.push(`  Schools: ${fmt(distSchools.length)}, Students: ${fmt(dStudents)}, Flagged: ${fmt(dFlagged)} (${dStudents ? pct(dFlagged / dStudents) : "N/A"})`);
      lines.push(`  Avg dropout risk: ${pct(dAvgRisk)}`);

      // Top schools in district
      const topDistSchools = [...distSchools]
        .sort((a, b) => (b.nFlagged ?? 0) - (a.nFlagged ?? 0))
        .slice(0, 10)
        .filter((s) => (s.nFlagged ?? 0) > 0);
      if (topDistSchools.length > 0) {
        lines.push(`  Schools with most flagged students:`);
        for (const s of topDistSchools) {
          lines.push(`    ${s.schoolName}: ${fmt(s.nStudents ?? 0)} students, ${fmt(s.nFlagged ?? 0)} flagged, risk ${pct(s.avgRisk ?? 0)}`);
        }
      }
      lines.push(`=== END OF YOUR DISTRICT ===\n`);
    } else {
      lines.push(`(Note: district "${opts.userDistrict}" not found in database)\n`);
    }
  }

  // ── Role-filtered supplementary data ────────────────────────────────────

  const r = opts.role;

  // SED: full statewide overview
  if (r === "sed") {
    lines.push(`--- STATEWIDE OVERVIEW ---`);
    lines.push(`Total students: ${fmt(totalStudents)}`);
    lines.push(`Total schools: ${fmt(schools.length)}`);
    lines.push(`Total flagged at-risk: ${fmt(totalFlagged)} (${totalStudents > 0 ? pct(totalFlagged / totalStudents) : "N/A"})`);
    lines.push(`Overall avg dropout risk: ${pct(overallAvgRisk)}`);

    // All districts
    const distMap = new Map<string, { nSchools: number; nStudents: number; nFlagged: number; avgRisk: number; nCritical: number }>();
    for (const s of schools) {
      const d = s.districtName ?? "Unknown";
      if (!distMap.has(d)) distMap.set(d, { nSchools: 0, nStudents: 0, nFlagged: 0, avgRisk: 0, nCritical: 0 });
      const entry = distMap.get(d)!;
      entry.nSchools += 1;
      entry.nStudents += s.nStudents ?? 0;
      entry.nFlagged += s.nFlagged ?? 0;
      entry.avgRisk += s.avgRisk ?? 0;
      if ((s.pctCritical ?? 0) > 0.05) entry.nCritical += 1;
    }
    lines.push(`\nDistricts (${distMap.size} total):`);
    for (const [name, entry] of distMap) {
      const avg = entry.nSchools > 0 ? entry.avgRisk / entry.nSchools : 0;
      const p = entry.nStudents > 0 ? (entry.nFlagged / entry.nStudents) * 100 : 0;
      lines.push(`  ${name}: ${fmt(entry.nSchools)} schools, ${fmt(entry.nStudents)} students, ${fmt(entry.nFlagged)} flagged (${p.toFixed(1)}%), avg risk ${pct(avg)}`);
    }

    // Top schools statewide
    const topSchools = [...schools].sort((a, b) => (b.nFlagged ?? 0) - (a.nFlagged ?? 0)).slice(0, 10);
    lines.push(`\nTop schools by flagged count:`);
    for (const s of topSchools) {
      if ((s.nFlagged ?? 0) > 0) {
        lines.push(`  ${s.schoolName ?? "Unknown"} (${s.districtName ?? "?"}): ${fmt(s.nStudents ?? 0)} students, ${fmt(s.nFlagged ?? 0)} flagged, avg risk ${pct(s.avgRisk ?? 0)}`);
      }
    }

    // Mandals statewide
    const sortedMandals = [...mandals]
      .filter((m) => (m.nStudents ?? 0) > 0)
      .sort((a, b) => (b.nFlagged ?? 0) - (a.nFlagged ?? 0))
      .slice(0, 8);
    if (sortedMandals.length > 0) {
      lines.push(`\nTop mandals by flagged count:`);
      for (const m of sortedMandals) {
        lines.push(`  ${m.mandalName ?? "Unknown"} (${m.districtName ?? "?"}): ${fmt(m.nStudents ?? 0)} students, ${fmt(m.nFlagged ?? 0)} flagged`);
      }
    }
  }

  // HM: top schools reference (only the list — no district/mandal/statewide numbers)
  if (r === "hm") {
    const topSchools = [...schools].sort((a, b) => (b.nFlagged ?? 0) - (a.nFlagged ?? 0)).slice(0, 5);
    lines.push(`\nOther schools reference (top 5 by flagged count):`);
    for (const s of topSchools) {
      if ((s.nFlagged ?? 0) > 0) {
        lines.push(`  ${s.schoolName ?? "Unknown"} (${s.districtName ?? "?"}): ${fmt(s.nFlagged ?? 0)} flagged`);
      }
    }
  }

  // Model performance, tier counts — HM, district, SED
  if (r !== "teacher" && metricsRow) {
    const testOot = metricsRow.testOotData as any;
    if (testOot) {
      lines.push(`\nModel performance (out-of-time test):`);
      lines.push(`  Recall: ${((testOot.recall ?? 0) * 100).toFixed(1)}%, Precision: ${((testOot.precision ?? 0) * 100).toFixed(1)}%`);
      lines.push(`  PR-AUC: ${(testOot.pr_auc ?? 0).toFixed(3)}, ROC-AUC: ${(testOot.roc_auc ?? 0).toFixed(3)}`);
    }

    const tiers = metricsRow.tierCounts as Record<string, number> | null;
    if (tiers) {
      lines.push(`\nRisk tier counts:`);
      lines.push(`  Critical: ${fmt(tiers.Critical ?? 0)}, High: ${fmt(tiers.High ?? 0)}, Medium: ${fmt(tiers.Medium ?? 0)}, Low: ${fmt(tiers.Low ?? 0)}`);
    }

    // Fairness — only district and SED (not HM)
    if (r !== "hm") {
      const fairness = metricsRow.fairnessData as Array<{ group: string; n: number; pos: number; recall: number | null; precision: number | null }> | null;
      if (fairness?.length) {
        lines.push(`\nFairness breakdown:`);
        for (const f of fairness) {
          const rec = f.recall != null ? pct(f.recall) : "N/A";
          const prec = f.precision != null ? pct(f.precision) : "N/A";
          lines.push(`  ${f.group}: ${fmt(f.n ?? 0)} enrolled, ${fmt(f.pos ?? 0)} flagged, recall: ${rec}, precision: ${prec}`);
        }
      }
    }
  }

  // Top risk factors — shareable with ALL roles
  if (metricsRow) {
    const features = metricsRow.featureImportance as Array<{ feature: string; importance: number }> | null;
    if (features?.length) {
      lines.push(`\nTop dropout risk factors:`);
      for (const f of features.slice(0, 7)) {
        lines.push(`  ${(f.feature ?? "?").replace(/_/g, " ")}: ${(f.importance * 100).toFixed(1)}%`);
      }
    }
  }

  return lines.join("\n");
}

// ── system prompt builder ───────────────────────────────────────────────────

function buildSystemPrompt(
  role: string,
  userName: string,
  userDistrict: string,
  userSchoolName: string,
  userGrade?: number
): string {
  const roleLabels: Record<string, string> = {
    teacher: "Teacher",
    hm: "Headmaster",
    district: "District Officer",
    sed: "SED Official",
  };
  const roleLabel = roleLabels[role] ?? "User";

  let scopeRules = "";
  if (role === "teacher") {
    scopeRules = `
SCOPE: TEACHER — Grade ${userGrade ?? "—"} at ${userSchoolName || "their school"}.

RULES:
- Answer ONLY about this teacher's assigned class (Grade ${userGrade ?? "—"}). Use "your class" or "your students".
- If the "YOUR CLASS" section is present, use that data to give specific numbers (students, flagged, risk, attendance, dropout reasons).
- If there is NO "YOUR CLASS" section, explain that grade-level data isn't loaded yet, but share available insights: top risk factors, attendance impact, government schemes, LEAP, data privacy.
- You CAN discuss: class risk status, at-risk counts (from YOUR CLASS), attendance alerts, dropout reasons, top risk factors, government schemes, LEAP, data privacy.
- You CANNOT share: school-wide totals, district data, mandal data, model accuracy, gender/caste breakdowns, migration stats, statewide numbers, or other classes' data.
- If asked for restricted data, explain it's outside your class scope and suggest what you CAN answer.
- Be helpful and proactive — share insights from the available data naturally.`;
  } else if (role === "hm") {
    scopeRules = `
SCOPE: HEADMASTER — ${userSchoolName || "your school"}.

RULES:
- Answer ONLY about your school. USE the "YOUR SCHOOL" section data for specific numbers.
- You CAN discuss: school-wide risk, flagged students, grade-level breakdown, attendance, top risk factors, model accuracy, dropout reasons, schemes, SHAP, LEAP, privacy.
- You CANNOT share: district data, other schools' data, statewide stats, or individual class/grade details (use the grade breakdown provided).
- If asked for data outside your school, explain it's not available.`;
  } else if (role === "district") {
    scopeRules = `
SCOPE: DISTRICT OFFICER — ${userDistrict || "your district"}.

RULES:
- Answer ONLY about your district. USE the "YOUR DISTRICT" section data.
- You CAN discuss: district-level stats, school comparisons within your district, flagged students, risk trends, attendance, model performance, schemes, SHAP, LEAP, privacy.
- You CANNOT share: statewide statistics, other districts' data, school-level details outside your district, or class-level data.
- If asked about data outside your district, explain it's not available.`;
  } else {
    scopeRules = `
SCOPE: SED OFFICIAL — Statewide access.

RULES:
- You can answer using ALL available data: statewide, all districts, mandals, model metrics, gender/caste equity, migration analysis, fairness, privacy, etc.
- Provide comprehensive analytics and insights across the state.`;
  }

  return `You are the Stay-In School AI assistant for Andhra Pradesh's dropout prevention system. You are speaking to a ${roleLabel}.

IMPORTANT — Answer using the live data provided. This is your ONLY source of truth.
${scopeRules}

FORMATTING:
- Use Indian number formatting (e.g., "1,23,456").
- Keep answers concise. Use bullet points for lists.
- Be friendly and proactive — when the user asks about their scope, give them the actual numbers from the data.
- If the data doesn't contain exactly what they ask, explain what IS available and offer to help with that.`;
}

// ── POST /api/chat ──────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, role, userName, userDistrict, userSchoolName, userGrade } = req.body as {
      query: string;
      role?: string;
      userName?: string;
      userDistrict?: string;
      userSchoolName?: string;
      userGrade?: number;
    };

    if (!query?.trim()) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    const systemPrompt = buildSystemPrompt(
      role ?? "teacher",
      userName ?? "",
      userDistrict ?? "",
      userSchoolName ?? "",
      userGrade,
    );
    let dataContext: string;
    try {
      dataContext = await fetchLiveData({
        role: role ?? "teacher",
        userSchoolName,
        userDistrict,
        userGrade,
      });
    } catch (dbErr: any) {
      console.error("fetchLiveData error:", dbErr);
      dataContext = `(Live data temporarily unavailable: ${dbErr.message || "unknown error"})`;
    }

    const userMessage = `
USER CONTEXT:
- Name: ${userName || "Not provided"}
- Role: ${role ?? "teacher"}
- School: ${userSchoolName || "N/A"}
- District: ${userDistrict || "N/A"}
- Grade: ${userGrade != null ? `Grade ${userGrade}` : "N/A"}

LIVE DATABASE DATA:
${dataContext}

USER QUERY:
${query}`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    res.json({ reply });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
