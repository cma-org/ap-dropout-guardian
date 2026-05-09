import { getSchools } from "@/lib/data";
import SEDDistrictsView from "./SEDDistrictsView";

export default async function SEDDistrictsPage() {
  const schools = await getSchools();
  return <SEDDistrictsView schools={schools ?? []} />;
}
