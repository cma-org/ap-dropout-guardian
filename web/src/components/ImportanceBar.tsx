"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ImportanceBar({ data }: { data: { feature: string; importance: number }[] }) {
  const top = data.slice(0, 12);
  const DPDP = new Set(["migration_flag", "parent_literacy", "family_income_bracket", "transport_allowance"]);
  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer>
        <BarChart data={top} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <XAxis type="number" stroke="#71717a" tickFormatter={(v) => v.toFixed(2)} />
          <YAxis type="category" dataKey="feature" stroke="#71717a" width={120} fontSize={11} interval={0} />
          <Tooltip formatter={(v: number) => v.toFixed(4)} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {top.map((d, i) => (
              <Cell key={i} fill={DPDP.has(d.feature) ? "#f47b20" : "#0b3b6f"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-zinc-500 mt-1">
        <span className="inline-block h-2 w-2 rounded-full bg-[#f47b20] mr-1" /> DPDP-restricted (synthetic stand-in)
        &nbsp;&nbsp;
        <span className="inline-block h-2 w-2 rounded-full bg-[#0b3b6f] mr-1" /> Real features
      </div>
    </div>
  );
}
