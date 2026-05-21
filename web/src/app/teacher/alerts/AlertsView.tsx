"use client";
import { useSearchParams } from "next/navigation";
import { useLang, T } from "@/lib/i18n";
import type { Alert, AlertStats, AlertPriority, AlertStatus } from "@/lib/types";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Clock,
  TrendingDown,
  BookOpen,
  Users,
  Plane,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  User,
  Calendar,
  Activity,
  ChevronRight,
  RefreshCw,
  Filter,
  Download,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AlertsViewProps {
  alerts: Alert[];
  stats: AlertStats;
  loading: boolean;
  selectedPriority: "all" | AlertPriority;
  selectedStatus: "all" | AlertStatus;
  onPriorityChange: (p: "all" | AlertPriority) => void;
  onStatusChange: (s: "all" | AlertStatus) => void;
  onStatusUpdate: (alertId: string, status: AlertStatus) => void;
  onEscalate: (alertId: string) => void;
  onRefresh?: () => void;
}

const PRIORITY_CONFIG = {
  critical: {
    label: { en: "Critical", te: "అత్యవసర" },
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
    iconBg: "bg-red-500",
    pulse: true,
  },
  high: {
    label: { en: "High", te: "అధిక" },
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertCircle,
    iconBg: "bg-orange-500",
    pulse: false,
  },
  medium: {
    label: { en: "Medium", te: "మధ్యస్థ" },
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Info,
    iconBg: "bg-yellow-500",
    pulse: false,
  },
};

const CATEGORY_ICONS = {
  attendance: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
  academic: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
  behavioral: { icon: Users, color: "text-teal-600", bg: "bg-teal-100" },
  migration: { icon: Plane, color: "text-amber-600", bg: "bg-amber-100" },
  综合: { icon: Activity, color: "text-rose-600", bg: "bg-rose-100" },
};

function formatTimeAgo(dateString: string, lang: "en" | "te"): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return lang === "en" ? `${diffMins}m ago` : `${diffMins} నిమిషాల క్రితం`;
  }
  if (diffHours < 24) {
    return lang === "en" ? `${diffHours}h ago` : `${diffHours} గంటల క్రితం`;
  }
  if (diffDays === 1) {
    return lang === "en" ? "Yesterday" : "నిన్న";
  }
  return lang === "en" ? `${diffDays}d ago` : `${diffDays} రోజుల క్రితం`;
}

function StatCard({
  priority,
  count,
  label,
  lang,
}: {
  priority: AlertPriority;
  count: number;
  label: string;
  lang: "en" | "te";
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl p-4 border", config.bg, config.border)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: `var(--ap-navy)` }}>
            {count}
          </p>
        </div>
        <div className={cn("p-3 rounded-xl", config.iconBg)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  lang,
  onStatusUpdate,
  onEscalate,
}: {
  alert: Alert;
  lang: "en" | "te";
  onStatusUpdate: (alertId: string, status: AlertStatus) => void;
  onEscalate: (alertId: string) => void;
}) {
  const config = PRIORITY_CONFIG[alert.priority];
  const Icon = config.icon;
  const categoryConfig = CATEGORY_ICONS[alert.category];
  const CategoryIcon = categoryConfig.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border bg-white overflow-hidden transition-all duration-200",
        config.border,
        alert.priority === "critical" && "ring-2 ring-red-200",
        alert.status === "resolved" && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Priority Icon */}
          <div className={cn("relative shrink-0", config.pulse && "animate-pulse")}>
            <div
              className={cn(
                "p-3 rounded-xl",
                config.iconBg,
                alert.status === "resolved" && "opacity-50"
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            {alert.escalated && (
              <div className="absolute -top-1 -right-1 p-1 bg-red-600 rounded-full">
                <ArrowUpRight className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                  config.badge
                )}
              >
                {config.label[lang]}
              </span>
              {alert.status !== "resolved" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    alert.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : alert.status === "acknowledged"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      alert.status === "pending" ? "bg-amber-500" : "bg-blue-500"
                    )}
                  />
                  {alert.status === "pending"
                    ? T.intervention.pending[lang]
                    : alert.status === "acknowledged"
                    ? T.intervention.inProgress[lang]
                    : "Escalated"}
                </span>
              )}
              <span className="text-xs text-zinc-400 ml-auto">
                {formatTimeAgo(alert.createdAt, lang)}
              </span>
            </div>

            <h3 className="font-semibold text-zinc-900 mt-2">{alert.studentName}</h3>
            <p className="text-sm text-zinc-500">
              {alert.schoolName} · Grade {alert.grade} · {alert.gender}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    alert.attendanceRate < 0.5
                      ? "text-red-600"
                      : alert.attendanceRate < 0.75
                      ? "text-amber-600"
                      : "text-emerald-600"
                  )}
                >
                  {Math.round(alert.attendanceRate * 100)}%
                </span>
                <span className="text-zinc-400 text-xs">{T.alerts.attendanceRate[lang]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    alert.avgMarks !== null && alert.avgMarks < 30
                      ? "text-red-600"
                      : alert.avgMarks !== null && alert.avgMarks < 50
                      ? "text-amber-600"
                      : "text-zinc-700"
                  )}
                >
                  {alert.avgMarks ?? "—"}
                </span>
                <span className="text-zinc-400 text-xs">{T.alerts.avgMarks[lang]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold text-zinc-700 tabular-nums">
                  {alert.consecutiveAbsences}
                </span>
                <span className="text-zinc-400 text-xs">
                  {T.alerts.consecutiveAbsences[lang]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
          <Link
            href={`/student/${alert.studentId}?year=${year}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <User className="h-4 w-4" />
            {T.alerts.viewStudent[lang]}
          </Link>

          {alert.status !== "resolved" && (
            <button
              onClick={() => onStatusUpdate(alert.id, "acknowledged")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {T.alerts.markResolved[lang]}
            </button>
          )}

          {!alert.escalated && alert.priority === "critical" && alert.status === "pending" && (
            <button
              onClick={() => onEscalate(alert.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 ml-auto"
            >
              <ArrowUpRight className="h-4 w-4" />
              {T.alerts.escalation[lang]}
            </button>
          )}
        </div>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-500 hover:bg-zinc-100 flex items-center justify-center gap-1"
      >
        {expanded ? "Hide details" : "View details"}
        <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-4">
          {/* Risk Drivers */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {T.alerts.riskDrivers[lang]}
            </h4>
            <div className="flex flex-wrap gap-2">
              {alert.drivers.map((driver, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-full text-xs text-zinc-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {driver}
                </span>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {T.alerts.recommendations[lang]}
            </h4>
            <div className="flex flex-wrap gap-2">
              {alert.recommendations.map((rec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[color:var(--ap-navy)]/5 border border-[color:var(--ap-navy)]/20 rounded-full text-xs text-[color:var(--ap-navy)]"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {rec}
                </span>
              ))}
            </div>
          </div>

          {/* Last Contact */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-500">{T.alerts.lastInteraction[lang]}:</span>
            <span className="font-medium text-zinc-700">
              {alert.lastContacted
                ? formatTimeAgo(alert.lastContacted, lang)
                : T.alerts.neverContacted[lang]}
            </span>
          </div>

          {/* Notes if any */}
          {alert.notes && (
            <div className="p-3 bg-white rounded-lg border border-zinc-200">
              <p className="text-sm text-zinc-600">{alert.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlertsView({
  alerts,
  stats,
  loading,
  selectedPriority,
  selectedStatus,
  onPriorityChange,
  onStatusChange,
  onStatusUpdate,
  onEscalate,
  onRefresh,
}: AlertsViewProps) {
  const { lang } = useLang();
  const sp = useSearchParams();
  const year = sp.get("year") ?? "2024-25";
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{T.alerts.title[lang]}</h1>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <Zap className="h-3 w-3" />
              {T.alerts.realTime[lang]}
            </span>
          </div>
          <p className="text-zinc-500 mt-1">{T.alerts.subtitle[lang]}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {T.alerts.refreshAlerts[lang]}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--ap-navy)] text-white rounded-lg text-sm font-medium hover:opacity-90">
            <Download className="h-4 w-4" />
            {T.alerts.exportAlerts[lang]}
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard priority="critical" count={stats.critical} label={T.alerts.criticalStudents[lang]} lang={lang} />
        <StatCard priority="high" count={stats.high} label={T.alerts.highRiskStudents[lang]} lang={lang} />
        <StatCard
          priority="medium"
          count={stats.medium}
          label={T.alerts.pendingActions[lang]}
          lang={lang}
        />
        <div className="rounded-xl bg-[color:var(--ap-navy)] p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                {T.alerts.totalAlerts[lang]}
              </p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Bell className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600">{T.alerts.priorityFilter[lang]}:</span>
          <div className="flex gap-1">
            {(["all", "critical", "high", "medium"] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPriorityChange(p)}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition",
                  selectedPriority === p
                    ? p === "all"
                      ? "bg-zinc-800 text-white"
                      : p === "critical"
                      ? "bg-red-500 text-white"
                      : p === "high"
                      ? "bg-orange-500 text-white"
                      : "bg-yellow-500 text-black"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {p === "all" ? T.alerts.all[lang] : PRIORITY_CONFIG[p as AlertPriority].label[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="h-8 w-px bg-zinc-200 hidden md:block" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600">{T.alerts.statusFilter[lang]}:</span>
          <div className="flex gap-1">
            {(["all", "pending", "acknowledged", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition",
                  selectedStatus === s
                    ? "bg-[color:var(--ap-navy)] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {s === "all"
                  ? T.alerts.all[lang]
                  : s === "pending"
                  ? T.intervention.pending[lang]
                  : s === "acknowledged"
                  ? T.intervention.inProgress[lang]
                  : T.alerts.resolved[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
          <div className="p-4 bg-emerald-100 rounded-full inline-flex mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">{T.alerts.noAlerts[lang]}</h3>
          <p className="text-zinc-500 mt-2">{lang === "en" ? "All students are on track!" : "అన్ని విద్యార్థులు ట్రాక్‌లో ఉన్నారు!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              lang={lang}
              onStatusUpdate={onStatusUpdate}
              onEscalate={onEscalate}
            />
          ))}
        </div>
      )}
    </div>
  );
}