"use client";
import { useEffect, useState, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import LayoutWrapper from "@/components/LayoutWrapper";
import ConsentModal from "@/components/ConsentModal";

export default function ClientShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <AuthProvider>
      <I18nProvider>
        <ConsentModal />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </I18nProvider>
    </AuthProvider>
  );
}
