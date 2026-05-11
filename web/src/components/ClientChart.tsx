"use client";
import { useEffect, useState, type ReactNode } from "react";

export default function ClientChart({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: "100%", height: "100%", minHeight: 200 }} />;
  return <>{children}</>;
}
