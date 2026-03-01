import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "../api/client";
import type { StrategyArenaResponse, StrategyPlanInput } from "../types";

const defaultPlans: StrategyPlanInput[] = [
  {
    id: "foundation-first",
    name: "Foundation First",
    focusConceptIds: ["Fractions", "Ratios"],
    sessionsPerDay: 2,
    accuracyBias: 0.15
  },
  {
    id: "exam-cram",
    name: "Exam Cram",
    focusConceptIds: ["AlgebraReadiness", "ProportionalReasoning"],
    sessionsPerDay: 3,
    accuracyBias: -0.05
  },
  {
    id: "mixed-spiral",
    name: "Mixed Spiral",
    focusConceptIds: ["Fractions", "Ratios", "ProportionalReasoning", "AlgebraReadiness"],
    sessionsPerDay: 2,
    accuracyBias: 0.05
  }
];

type StrategyArenaPanelProps = {
  days?: number;
};

export const StrategyArenaPanel = ({ days = 10 }: StrategyArenaPanelProps) => {
  const [data, setData] = useState<StrategyArenaResponse | null>(null);
  const [pending, setPending] = useState(false);

  const runArena = async () => {
    setPending(true);
    try {
      const response = await api.postStrategyArena({ days, plans: defaultPlans });
      setData(response);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    void runArena();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];

    const byDay: Record<number, Record<string, number>> = {};

    data.results.forEach((result) => {
      result.trajectory.forEach((point) => {
        if (!byDay[point.day]) {
          byDay[point.day] = { day: point.day };
        }
        byDay[point.day][result.name] = Number((point.readiness * 100).toFixed(1));
      });
    });

    return Object.values(byDay).sort((a, b) => Number(a.day) - Number(b.day));
  }, [data]);

  const palette = ["#0ea5e9", "#f97316", "#10b981"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Strategy Arena</h3>
          <p className="text-sm text-slate-500">A/B/C duel of study plans over {days} days.</p>
        </div>
        <button
          onClick={() => void runArena()}
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          Re-Simulate
        </button>
      </div>

      {data ? (
        <>
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-semibold">Winner: {data.results.find((entry) => entry.id === data.winnerId)?.name}</p>
            <p>{data.winnerReason}</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {data.results.map((result, idx) => (
                  <Line
                    key={result.id}
                    type="monotone"
                    dataKey={result.name}
                    stroke={palette[idx % palette.length]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {data.results.map((result) => (
              <div key={result.id} className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{result.name}</p>
                <p className="text-sm text-slate-600">Projected: {Math.round(result.projectedReadiness * 100)}%</p>
                <p className="text-sm text-slate-600">Lift: +{Math.round(result.expectedImprovement * 100)} pts</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Simulating arena...</p>
      )}
    </div>
  );
};
