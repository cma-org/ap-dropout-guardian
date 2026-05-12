import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

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
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){var w=window;function suppress(e){var f=e.filename||(e.error&&e.error.stack)||'';if(f.indexOf('chrome-extension://')!==-1){e.stopImmediatePropagation();e.preventDefault()}}w.addEventListener('error',suppress);w.addEventListener('unhandledrejection',function(e){if(e.reason&&e.reason.stack&&e.reason.stack.indexOf('chrome-extension://')!==-1){e.stopImmediatePropagation();e.preventDefault()}})})();`,
          }}
        />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
