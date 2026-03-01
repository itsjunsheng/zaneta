import type { StudentState } from "../types";

type ForgettingRiskPanelProps = {
  studentState: StudentState[];
};

const riskColor = (risk: number) => {
  if (risk > 0.6) return "bg-rose-500";
  if (risk > 0.35) return "bg-amber-500";
  return "bg-emerald-500";
};

export const ForgettingRiskPanel = ({ studentState }: ForgettingRiskPanelProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">Forgetting Risk Indicator</h3>
      <p className="text-sm text-slate-500">Higher values should be reviewed sooner.</p>
      <div className="mt-3 space-y-3">
        {studentState.map((entry) => {
          const risk = 1 - entry.retention;
          return (
            <div key={entry.conceptId}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{entry.conceptId}</span>
                <span>{Math.round(risk * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${riskColor(risk)}`}
                  style={{ width: `${Math.max(6, Math.round(risk * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
