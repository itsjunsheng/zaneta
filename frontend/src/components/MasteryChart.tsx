import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { StudentState } from "../types";

type MasteryChartProps = {
  studentState: StudentState[];
};

const masteryColor = (mastery: number) => {
  if (mastery < 0.35) return "#ef4444";
  if (mastery < 0.65) return "#eab308";
  return "#22c55e";
};

export const MasteryChart = ({ studentState }: MasteryChartProps) => {
  const chartData = studentState.map((state) => ({
    conceptId: state.conceptId,
    masteryPct: Number((state.effectiveMastery * 100).toFixed(1)),
    fill: masteryColor(state.effectiveMastery)
  }));

  return (
    <div className="h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Effective Mastery by Concept</h3>
        <p className="text-sm text-slate-500">Mastery adjusted by forgetting decay</p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="conceptId" tick={{ fill: "#334155", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#334155", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="masteryPct" animationDuration={400} radius={[6, 6, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.conceptId} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
