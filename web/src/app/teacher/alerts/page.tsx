"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";
import AlertsView from "./AlertsView";
import type { Alert, AlertStats } from "@/lib/types";

export default function AlertsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({ critical: 0, high: 0, medium: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<"all" | "critical" | "high" | "medium">("all");
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "acknowledged" | "resolved" | "escalated" | "all">("all");

  const fetchAlerts = async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build URL with grade parameter for teacher
      const params = new URLSearchParams({ schoolId: String(user.schoolId) });
      if (user.role === "teacher" && user.grade) {
        params.set("grade", String(user.grade));
      }
      const response = await fetch(`/api/alerts?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setStats(data.stats || { critical: 0, high: 0, medium: 0, pending: 0, total: 0 });
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(err instanceof Error ? err.message : "Failed to load alerts");
      setAlerts([]);
      setStats({ critical: 0, high: 0, medium: 0, pending: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user?.schoolId]);

  useEffect(() => {
    const criticalCount = alerts.filter(a => a.priority === "critical" && a.status === "pending").length;
    localStorage.setItem("alerts_count", String(criticalCount));
  }, [alerts]);

  const filteredAlerts = alerts.filter(alert => {
    const priorityMatch = selectedPriority === "all" || alert.priority === selectedPriority;
    const statusMatch = selectedStatus === "all" || alert.status === selectedStatus;
    return priorityMatch && statusMatch;
  });

  const handleStatusChange = (alertId: string, newStatus: Alert["status"]) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, status: newStatus, updatedAt: new Date().toISOString() }
        : alert
    ));

    // Update stats
    setStats(prev => ({
      ...prev,
      pending: newStatus === "pending" ? prev.pending : prev.pending - 1,
    }));
  };

  const handleEscalate = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, escalated: true, status: "escalated", updatedAt: new Date().toISOString() }
        : alert
    ));
  };

  if (error) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{T.alerts.title[lang]}</h1>
            <p className="text-zinc-500 mt-1">{T.alerts.subtitle[lang]}</p>
          </div>
        </header>

        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
          <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">{lang === "en" ? "Error Loading Alerts" : "అలర్ట్‌లు లోడ్ చేయడంలో లోపం"}</h3>
          <p className="text-zinc-500 mt-2">{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-4 px-4 py-2 bg-[color:var(--ap-navy)] text-white rounded-lg font-medium hover:opacity-90"
          >
            {T.alerts.refreshAlerts[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AlertsView
      alerts={filteredAlerts}
      stats={stats}
      loading={loading}
      selectedPriority={selectedPriority}
      selectedStatus={selectedStatus}
      onPriorityChange={setSelectedPriority}
      onStatusChange={setSelectedStatus}
      onStatusUpdate={handleStatusChange}
      onEscalate={handleEscalate}
      onRefresh={fetchAlerts}
    />
  );
}