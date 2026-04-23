"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";

interface Props {
  precision: number[];
  recall: number[];
  operatingRecall: number;
  operatingPrecision: number;
}

export default function PRCurve({ precision, recall, operatingRecall, operatingPrecision }: Props) {
  const data = recall.map((r, i) => ({ recall: r, precision: precision[i] })).sort((a, b) => a.recall - b.recall);
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="recall"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: "Recall (share of dropouts caught)", position: "insideBottom", offset: -15, style: { fill: "#52525b", fontSize: 12 } }}
            stroke="#71717a"
          />
          <YAxis
            domain={[0, 0.6]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: "Precision", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#52525b", fontSize: 12 } }}
            stroke="#71717a"
          />
          <Tooltip
            formatter={(v: number, n: string) => [`${(v * 100).toFixed(1)}%`, n === "precision" ? "Precision" : "Recall"]}
          />
          <Line type="monotone" dataKey="precision" stroke="#0b3b6f" strokeWidth={2} dot={false} />
          <ReferenceLine x={0.80} stroke="#f47b20" strokeDasharray="3 3" label={{ value: "Target recall 80%", fill: "#f47b20", fontSize: 11, position: "top" }} />
          <ReferenceLine y={0.20} stroke="#138a36" strokeDasharray="3 3" label={{ value: "Target precision 20%", fill: "#138a36", fontSize: 11, position: "insideTopRight" }} />
          <ReferenceDot x={operatingRecall} y={operatingPrecision} r={6} fill="#f47b20" stroke="white" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
