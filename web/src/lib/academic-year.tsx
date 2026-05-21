"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export const ACADEMIC_YEARS = ["2024-25", "2023-24"] as const;
export type AcademicYear = (typeof ACADEMIC_YEARS)[number];
export const DEFAULT_YEAR: AcademicYear = "2024-25";
const STORAGE_KEY = "ap_academic_year";

export function useAcademicYear() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = params.get("year");
  const year: AcademicYear =
    raw && ACADEMIC_YEARS.includes(raw as AcademicYear)
      ? (raw as AcademicYear)
      : DEFAULT_YEAR;

  // When URL has no year param, restore from localStorage (handles navigation without year in link)
  useEffect(() => {
    if (!raw) {
      const stored = localStorage.getItem(STORAGE_KEY) as AcademicYear | null;
      if (stored && ACADEMIC_YEARS.includes(stored) && stored !== DEFAULT_YEAR) {
        router.replace(`${pathname}?year=${stored}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Persist selected year so it survives navigation
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, year);
  }, [year]);

  const setYear = (y: AcademicYear) => {
    localStorage.setItem(STORAGE_KEY, y);
    const next = new URLSearchParams(params.toString());
    next.set("year", y);
    router.push(`${pathname}?${next.toString()}`);
  };

  return { year, setYear, years: ACADEMIC_YEARS };
}
