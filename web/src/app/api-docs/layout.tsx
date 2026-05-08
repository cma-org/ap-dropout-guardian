import RequireAuth from "@/components/RequireAuth";

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
