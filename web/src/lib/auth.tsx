"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "teacher" | "hm" | "district" | "sed";

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: Role;
  schoolId?: number;
  schoolName?: string;
  district?: string;
  grade?: number;
}

const DEMO_SCHOOL_ID = 28161790952;
const DEMO_SCHOOL_NAME = "K.B.C ZP HS (B) PATAMATA";
const DEMO_DISTRICT = "NTR";

export const DUMMY_USERS: Record<string, UserSession & { password: string }> = {
  "teacher@zphs.ap.gov.in": {
    id: 1,
    email: "teacher@zphs.ap.gov.in",
    password: "teacher123",
    role: "teacher",
    name: "K. Ravi Kumar",
    schoolId: DEMO_SCHOOL_ID,
    schoolName: DEMO_SCHOOL_NAME,
    district: DEMO_DISTRICT,
    grade: 8,
  },
  "principal@zphs.ap.gov.in": {
    id: 2,
    email: "principal@zphs.ap.gov.in",
    password: "hm123",
    role: "hm",
    name: "G. Srinivas",
    schoolId: DEMO_SCHOOL_ID,
    schoolName: DEMO_SCHOOL_NAME,
    district: DEMO_DISTRICT,
  },
  "deo@ntr.ap.gov.in": {
    id: 3,
    email: "deo@ntr.ap.gov.in",
    password: "district123",
    role: "district",
    name: "D. Padmavathi",
    district: DEMO_DISTRICT,
  },
  "director@apsed.ap.gov.in": {
    id: 4,
    email: "director@apsed.ap.gov.in",
    password: "sed123",
    role: "sed",
    name: "A. Nageswara Rao",
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  teacher: "Teacher",
  hm: "Head Master",
  district: "District Officer",
  sed: "School Education Dept.",
};

export const ROLE_DASHBOARD: Record<Role, string> = {
  teacher: "/dashboard/teacher",
  hm: "/dashboard/hm",
  district: "/dashboard/district",
  sed: "/dashboard/sed",
};

interface AuthCtx {
  user: UserSession | null;
  isInitialized: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, isInitialized: false, login: () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_session");
      if (raw) setUser(JSON.parse(raw) as UserSession);
    } catch { /* ignore */ }
    setIsInitialized(true);
  }, []);

  const login = (email: string, password: string): boolean => {
    const found = DUMMY_USERS[email.toLowerCase()];
    if (!found || found.password !== password) return false;
    const { password: _, ...session } = found;
    setUser(session);
    localStorage.setItem("auth_session", JSON.stringify(session));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_session");
  };

  return <Ctx.Provider value={{ user, isInitialized, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
