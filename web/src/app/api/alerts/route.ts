import { NextResponse, type NextRequest } from "next/server";
import type { Alert, AlertStats, RosterStudent, AlertPriority } from "@/lib/types";

const apiUrl = process.env.API_URL;
const internalKey = process.env.INTERNAL_API_KEY;

function internalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-key": internalKey ?? "",
  };
}

// Deterministic hash function to match analytics page enrichment
function rosterExtras(child_sno: number) {
  const h1 = Math.imul(child_sno, 2654435761) >>> 0;
  const h2 = Math.imul(h1 ^ (h1 >>> 16), 2246822519) >>> 0;
  const h3 = Math.imul(h2 ^ (h2 >>> 13), 3266489917) >>> 0;
  const h4 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) >>> 0;
  return {
    grade: 6 + (h1 % 5),
    migration_flag: (h2 % 7) === 0 ? 1 : 0,
    transport_allowance: (h3 % 4) === 0 ? 1 : 0,
    caste_clean: 1 + (h4 % 4),
    parent_literacy: 1 + (h1 % 3),
    family_income_bracket: 1 + (h2 % 4),
    attendance_fallback: 0.55 + (h3 % 45) / 100,
  };
}

// GET /api/alerts?schoolId=<n>&grade=<n>
export async function GET(request: NextRequest) {
  if (!apiUrl) {
    return NextResponse.json({ error: "API_URL not configured" }, { status: 503 });
  }

  const schoolId = request.nextUrl.searchParams.get("schoolId");
  const grade = request.nextUrl.searchParams.get("grade");

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
  }

  try {
    // Fetch roster from backend
    const rosterRes = await fetch(`${apiUrl}/api/schools/${schoolId}/roster`, {
      headers: internalHeaders(),
      cache: "no-store",
    });

    if (!rosterRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch roster: ${rosterRes.status}` },
        { status: rosterRes.status }
      );
    }

    let roster: any[] = await rosterRes.json();

    // Enrich roster with generated fields (same as teacher analytics page)
    roster = roster.map((s) => {
      const e = rosterExtras(s.child_sno);
      const student = s as any;
      return {
        ...s,
        grade: student.grade ?? e.grade,
        caste_clean: student.caste_clean ?? e.caste_clean,
        parent_literacy: student.parent_literacy ?? e.parent_literacy,
        migration_flag: student.migration_flag ?? e.migration_flag,
        transport_allowance: student.transport_allowance ?? e.transport_allowance,
        family_income_bracket: student.family_income_bracket ?? e.family_income_bracket,
        attendance_rate: student.attendance_rate ?? e.attendance_fallback,
      };
    });

    // Filter by grade if provided (for teacher view)
    if (grade !== null) {
      const gradeNum = parseInt(grade, 10);
      roster = roster.filter((student) => student.grade === gradeNum);
    }

    // Generate alerts from roster data based on risk tiers
    const alerts: Alert[] = roster
      .filter((student: any) => student.tier === "Critical" || student.tier === "High" || student.tier === "Medium")
      .map((student, index) => {
        // Determine alert priority based on tier
        const priority: AlertPriority = student.tier === "Critical" ? "critical" :
                        student.tier === "High" ? "high" : "medium";

        // Determine alert category based on student attributes
        let category: Alert["category"] = "academic";
        if (student.attendance_rate < 0.5) {
          category = "attendance";
        } else if (student.migration_flag === 1) {
          category = "migration";
        }

        // Generate risk drivers based on student data
        const drivers: string[] = [];
        if (student.attendance_rate < 0.6) {
          drivers.push(`Attendance below ${Math.round(student.attendance_rate * 100)}%`);
        }
        if (student.fa_avg !== null && student.fa_avg < 30) {
          drivers.push(`FA average below 30 marks`);
        }
        if (student.migration_flag === 1) {
          drivers.push("Seasonal migration pattern detected");
        }
        if (student.grade !== undefined && student.grade >= 10) {
          drivers.push("Class 10 exam pressure");
        }

        // Generate recommendations based on risk factors
        const recommendations: string[] = [];
        if (student.attendance_rate < 0.6) {
          recommendations.push("Schedule home visit to understand attendance barriers");
        }
        if (student.fa_avg !== null && student.fa_avg < 30) {
          recommendations.push("Arrange remedial classes or tutoring support");
        }
        if (student.migration_flag === 1) {
          recommendations.push("Pre-coordinate with parents for upcoming migration period");
        }
        recommendations.push("Schedule parent meeting to discuss student progress");

        // Determine intervention type based on priority
        const interventionTypes = ["Home visit", "Parent meeting", "Counselling session", "Academic support", "Financial aid referral"];
        const interventionType = interventionTypes[priority === "critical" ? 0 : priority === "high" ? 1 : 2];

        // Generate a deterministic student name based on child_sno
        const studentName = `Student #${student.child_sno}`;

        // Calculate days absent based on attendance rate (assuming 180 school days)
        const totalDays = 180;
        const daysAbsent = Math.round(totalDays * (1 - student.attendance_rate));
        const consecutiveAbsences = Math.min(daysAbsent, 15);

        return {
          id: `alert-${student.child_sno}-${Date.now()}`,
          studentId: student.child_sno,
          studentName,
          schoolName: "", // Will be filled from school data
          grade: student.grade || 9,
          gender: student.gender_label,
          priority,
          status: "pending" as const,
          category,
          riskScore: student.risk_score,
          attendanceRate: student.attendance_rate,
          avgMarks: student.fa_avg,
          consecutiveAbsences,
          lastContacted: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          drivers,
          recommendations,
          escalated: priority === "critical",
          interventionType,
        };
      })
      .sort((a, b) => {
        // Sort by priority (critical first) then by risk score (highest first)
        const priorityOrder: Record<AlertPriority, number> = { critical: 0, high: 1, medium: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.riskScore - a.riskScore;
      });

    // Calculate stats
    const stats: AlertStats = {
      critical: alerts.filter(a => a.priority === "critical" && a.status !== "resolved").length,
      high: alerts.filter(a => a.priority === "high" && a.status !== "resolved").length,
      medium: alerts.filter(a => a.priority === "medium" && a.status !== "resolved").length,
      pending: alerts.filter(a => a.status === "pending").length,
      total: alerts.length,
    };

    return NextResponse.json({ alerts, stats });

  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}