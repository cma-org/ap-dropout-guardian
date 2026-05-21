import { getSchools } from "@/lib/data";
import SEDDistrictsView from "./SEDDistrictsView";

export default async function SEDDistrictsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year = "2024-25" } = await searchParams;
  const schools = await getSchools(year);
  return <SEDDistrictsView schools={schools ?? []} />;
}
