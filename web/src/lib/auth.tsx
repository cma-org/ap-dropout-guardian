"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "teacher" | "hm" | "district" | "rtgs";

export interface UserSession {
  email: string;
  name: string;
  role: Role;
  schoolId?: number;
  schoolName?: string;
  district?: string;
}

const DEMO_SCHOOL_ID = 28161790952;
const DEMO_SCHOOL_NAME = "K.B.C ZP HS (B) PATAMATA";
const DEMO_DISTRICT = "NTR";

export const DUMMY_USERS: Record<string, UserSession & { password: string }> = {
  "teacher@zphs.ap.gov.in": {
    email: "teacher@zphs.ap.gov.in",
    password: "teacher123",
    role: "teacher",
    name: "K. Ramadevi",
    schoolId: DEMO_SCHOOL_ID,
    schoolName: DEMO_SCHOOL_NAME,
    district: DEMO_DISTRICT,
  },
  "principal@zphs.ap.gov.in": {
    email: "principal@zphs.ap.gov.in",
    password: "hm123",
    role: "hm",
    name: "P. Suresh Kumar",
    schoolId: DEMO_SCHOOL_ID,
    schoolName: DEMO_SCHOOL_NAME,
    district: DEMO_DISTRICT,
  },
  "deo@ntr.ap.gov.in": {
    email: "deo@ntr.ap.gov.in",
    password: "district123",
    role: "district",
    name: "V. Lakshmipathi",
    district: DEMO_DISTRICT,
  },
  "admin@rtgs.ap.gov.in": {
    email: "admin@rtgs.ap.gov.in",
    password: "rtgs123",
    role: "rtgs",
    name: "RTGS Admin",
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  teacher: "Teacher",
  hm: "Head Master",
  district: "District Officer",
  rtgs: "RTGS Admin",
};

export const ROLE_DASHBOARD: Record<Role, string> = {
  teacher: "/dashboard/teacher",
  hm: "/dashboard/hm",
  district: "/dashboard/district",
  rtgs: "/dashboard/rtgs",
};

interface AuthCtx {
  user: UserSession | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, login: () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_session");
      if (raw) setUser(JSON.parse(raw) as UserSession);
    } catch { /* ignore */ }
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

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
