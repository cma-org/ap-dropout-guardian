import RequireAuth from "@/components/RequireAuth";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
