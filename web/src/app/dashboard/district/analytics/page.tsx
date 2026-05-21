"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAcademicYear } from "@/lib/academic-year";
import DistrictAnalyticsView from "./DistrictAnalyticsView";
import type { DistrictAnalytics } from "@/lib/analytics-types";

export default function DistrictAnalyticsPage() {
  const { user } = useAuth();
  const { year } = useAcademicYear();
  const [data, setData] = useState<DistrictAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.district) return;
    setData(null);
    setError("");
    fetch(`/api/analytics/district/${encodeURIComponent(user.district)}?academicYear=${year}`)
      .then(res => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json() as Promise<DistrictAnalytics>;
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, [user?.district, year]);

  if (error) {
    return (
      <div className="p-12 text-center text-zinc-400">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-zinc-400">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-100 rounded w-64 mx-auto" />
          <div className="h-4 bg-zinc-100 rounded w-96 mx-auto" />
        </div>
      </div>
    );
  }

  return <DistrictAnalyticsView data={data} />;
}
