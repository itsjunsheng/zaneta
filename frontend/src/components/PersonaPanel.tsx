import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";
import type { LearningPersona } from "../types";

type PersonaPanelProps = {
  persona: LearningPersona;
};

export const PersonaPanel = ({ persona }: PersonaPanelProps) => {
  const chartData = [
    { dimension: "Momentum", score: Math.round(persona.momentum * 100) },
    { dimension: "Resilience", score: Math.round(persona.resilience * 100) },
    { dimension: "Efficiency", score: Math.round(persona.efficiency * 100) }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-xl font-semibold text-slate-900">Learning Persona</h3>
      <p className="text-sm text-slate-500">Behavioral fingerprint generated from your learning dynamics.</p>

      <div className="mt-3 rounded-xl bg-indigo-50 p-3">
        <p className="text-sm font-semibold text-indigo-900">{persona.label}</p>
        <p className="text-sm text-indigo-800">{persona.summary}</p>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
            <Radar dataKey="score" stroke="#2563eb" fill="#60a5fa" fillOpacity={0.45} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
