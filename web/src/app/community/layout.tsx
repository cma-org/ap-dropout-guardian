import RequireAuth from "@/components/RequireAuth";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
