import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import LayoutWrapper from "@/components/LayoutWrapper";
import ConsentModal from "@/components/ConsentModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AP Stay-In School",
  description: "AI-powered early-warning system for secondary education — RTGS, Government of Andhra Pradesh",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <AuthProvider>
          <I18nProvider>
            <ConsentModal />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
