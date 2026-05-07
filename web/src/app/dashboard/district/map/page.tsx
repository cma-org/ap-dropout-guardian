import { getSchools, getMandals } from "@/lib/data";
import DistrictMapView from "./DistrictMapView";

export const dynamic = "force-dynamic";

export default async function DistrictMapPage() {
  const [schools, mandals] = await Promise.all([getSchools(), getMandals()]);

  const withCoords = schools.filter(
    (s) =>
      s.latitude != null &&
      s.longitude != null &&
      Number.isFinite(s.latitude) &&
      Number.isFinite(s.longitude)
  );

  const withMandalCoords = mandals.filter(
    (m) => m.latitude != null && m.longitude != null
  );

  return <DistrictMapView schools={withCoords} mandals={withMandalCoords} />;
}
