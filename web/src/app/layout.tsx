import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AP Dropout Guardian",
  description: "AI-assisted early-warning system for student dropouts — RTGS, Government of Andhra Pradesh",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <I18nProvider>
            <Header />
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-6">
              {children}
            </main>
            <footer className="text-center text-xs text-zinc-500 py-4 border-t border-zinc-200">
              RTGS AI Hackathon — Confidential. Data: School Education Dept. DPDP-restricted fields shown as calibrated stand-ins.
            </footer>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
