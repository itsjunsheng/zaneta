import { useState } from "react";
import { api } from "../api/client";

type SimulationPanelProps = {
  onSimulated: () => Promise<void>;
};

export const SimulationPanel = ({ onSimulated }: SimulationPanelProps) => {
  const [pending, setPending] = useState(false);

  const submitBatch = async (
    planName: string,
    interactions: Array<{ conceptId: string; correct: boolean; responseTime: number; errorType?: string }>
  ) => {
    setPending(true);
    try {
      for (const interaction of interactions) {
        await api.postInteraction(interaction);
      }
      await onSimulated();
    } finally {
      setPending(false);
    }

    return planName;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-xl font-semibold text-slate-900">Mission Simulator</h3>
      <p className="mt-1 text-sm text-slate-500">
        Trigger realistic learning missions to stress-test how the twin reacts.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          onClick={() =>
            void submitBatch("Recovery Mission", [
              { conceptId: "Ratios", correct: false, responseTime: 14, errorType: "numerator_denominator_confusion" },
              { conceptId: "Ratios", correct: false, responseTime: 13, errorType: "numerator_denominator_confusion" },
              { conceptId: "Fractions", correct: true, responseTime: 8 }
            ])
          }
          disabled={pending}
          className="rounded-lg bg-rose-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
        >
          Recovery Mission
        </button>

        <button
          onClick={() =>
            void submitBatch("Fluency Mission", [
              { conceptId: "Fractions", correct: true, responseTime: 7 },
              { conceptId: "Ratios", correct: true, responseTime: 8 },
              { conceptId: "ProportionalReasoning", correct: true, responseTime: 9 }
            ])
          }
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          Fluency Mission
        </button>

        <button
          onClick={() =>
            void submitBatch("Exam Pressure", [
              { conceptId: "AlgebraReadiness", correct: false, responseTime: 16, errorType: "symbol_manipulation" },
              { conceptId: "ProportionalReasoning", correct: true, responseTime: 10 },
              { conceptId: "AlgebraReadiness", correct: true, responseTime: 11 }
            ])
          }
          disabled={pending}
          className="rounded-lg bg-amber-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
        >
          Exam Pressure
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Each mission sends multiple interactions so recommendation shifts are visible immediately.
      </p>
    </div>
  );
};
