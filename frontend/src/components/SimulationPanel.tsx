import { useMemo, useState } from "react";
import { api } from "../api/client";

type SimulationPanelProps = {
  onSimulated: () => Promise<void>;
};

export const SimulationPanel = ({ onSimulated }: SimulationPanelProps) => {
  const [ratioTries, setRatioTries] = useState(0);
  const [pending, setPending] = useState(false);

  const nextRatioInteraction = useMemo(() => {
    const shouldFail = ratioTries < 3;
    return {
      correct: !shouldFail,
      errorType: shouldFail ? "numerator_denominator_confusion" : undefined,
      responseTime: shouldFail ? 14 : 9
    };
  }, [ratioTries]);

  const submitInteraction = async (body: {
    conceptId: string;
    correct: boolean;
    responseTime: number;
    errorType?: string;
  }) => {
    setPending(true);
    try {
      await api.postInteraction(body);
      await onSimulated();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">Simulation Panel</h3>
      <p className="mt-1 text-sm text-slate-500">
        Send deterministic practice events to update the twin live.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() =>
            void submitInteraction({
              conceptId: "Fractions",
              correct: true,
              responseTime: 7
            })
          }
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          Practice Fractions
        </button>

        <button
          onClick={() => {
            void submitInteraction({
              conceptId: "Ratios",
              ...nextRatioInteraction
            });
            setRatioTries((prev) => prev + 1);
          }}
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
        >
          Practice Ratios
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        First 3 ratio attempts are incorrect to demonstrate misconception detection.
      </p>
    </div>
  );
};
