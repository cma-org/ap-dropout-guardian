import { getSchools, getMandals } from "@/lib/data";
import type { MandalInfo } from "@/lib/types";
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
  // Map mandals to MandalInfo (filter out ones without coordinates)
  const mandalsWithCoords: MandalInfo[] = mandals
    .filter((m) => m.latitude !== null && m.longitude !== null && Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
    .map((m) => ({
      mandal_name: m.mandal_name!,
      district_name: m.district_name!,
      n_students: m.n_students,
      n_flagged: m.n_flagged,
      avg_risk: m.avg_risk,
      latitude: m.latitude!,
      longitude: m.longitude!,
    }));
  return <MapView schools={withCoords} mandals={mandalsWithCoords} topMandals={topMandals} />;
}
