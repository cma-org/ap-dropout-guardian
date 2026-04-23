import { getSchools, getMandals } from "@/lib/data";
import MapView from "./MapView";

export const dynamic = "force-static";

export default async function MapPage() {
  const [schools, mandals] = await Promise.all([getSchools(), getMandals()]);
  // Keep only schools with coords
  const withCoords = schools.filter(
    (s) => s.latitude !== null && s.longitude !== null && Number.isFinite(s.latitude) && Number.isFinite(s.longitude)
  );
  const topMandals = mandals
    .filter((m) => m.n_students >= 50 && m.mandal_name)
    .sort((a, b) => b.avg_risk - a.avg_risk)
    .slice(0, 15);
  return <MapView schools={withCoords} topMandals={topMandals} />;
}
