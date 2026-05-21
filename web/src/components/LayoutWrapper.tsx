"use client";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import FloatingChatbot from "./FloatingChatbot";
import { useAuth } from "@/lib/auth";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-full flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        {user && (
          <Suspense fallback={<div className="w-64 shrink-0 border-r border-zinc-200 bg-zinc-50/30 hidden md:block" />}>
            <Sidebar />
          </Suspense>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <main className={`flex-1 w-full ${pathname === '/' ? '' : 'max-w-[1400px] mx-auto px-6 py-6'}`}>
            {children}
          </main>
          {/* <footer className="text-center text-xs text-zinc-500 py-4 border-t border-zinc-200">
            RTGS AI Hackathon — Confidential. Data: School Education Dept. DPDP-restricted fields shown as calibrated stand-ins.
          </footer> */}
        </div>
      </div>
      <FloatingChatbot />
    </div>
  );
}
