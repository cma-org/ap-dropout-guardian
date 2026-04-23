import { getSchools, getMandals } from "@/lib/data";
import DistrictDashboard from "./DistrictDashboard";

export default async function DistrictPage() {
  const [schools, mandals] = await Promise.all([getSchools(), getMandals()]);
  const ntrSchools = schools.filter((s) => s.district_name === "NTR");
  const ntrMandals = mandals.filter((m) => m.district_name === "NTR");
  return <DistrictDashboard schools={ntrSchools} mandals={ntrMandals} districtName="NTR" allSchools={schools} />;
}
