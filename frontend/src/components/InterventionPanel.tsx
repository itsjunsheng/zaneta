import type { InterventionPlan } from "../types";

type InterventionPanelProps = {
  plans: InterventionPlan[];
};

export const InterventionPanel = ({ plans }: InterventionPanelProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">Intervention Mode</h3>
      <p className="text-sm text-slate-500">Targeted remediation plans for detected misconceptions.</p>

      <div className="mt-3 space-y-3">
        {plans.length === 0 ? (
          <p className="text-sm text-slate-500">No intervention plan yet. Trigger repeated errors to generate one.</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.title} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">{plan.title}</p>
              <ol className="mt-2 space-y-1 text-xs text-amber-700">
                {plan.steps.map((step, index) => (
                  <li key={step}>{index + 1}. {step}</li>
                ))}
              </ol>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
