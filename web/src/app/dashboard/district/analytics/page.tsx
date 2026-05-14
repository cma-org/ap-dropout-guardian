"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import DistrictAnalyticsView from "./DistrictAnalyticsView";
import type { DistrictAnalytics } from "@/lib/analytics-types";

export default function DistrictAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DistrictAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.district) return;
    fetch(`/api/analytics/district/${encodeURIComponent(user.district)}`)
      .then(res => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json() as Promise<DistrictAnalytics>;
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, [user?.district]);

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
