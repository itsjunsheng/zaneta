type AICoachPanelProps = {
  explanation: string;
  misconceptions: { conceptId: string; errorType: string; count: number }[];
};

export const AICoachPanel = ({ explanation, misconceptions }: AICoachPanelProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">AI Coach</h3>
      <p className="mt-2 rounded-lg bg-sky-50 p-3 text-sm text-slate-700">{explanation}</p>

      <div className="mt-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Misconception Flags
        </h4>
        <div className="mt-2 space-y-2">
          {misconceptions.length === 0 ? (
            <p className="text-sm text-slate-500">No repeated misconception pattern detected yet.</p>
          ) : (
            misconceptions.map((misconception) => (
              <div key={`${misconception.conceptId}-${misconception.errorType}`} className="rounded-lg bg-rose-50 p-3">
                <p className="text-sm font-medium text-rose-700">
                  {misconception.conceptId}: {misconception.errorType.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-rose-600">Observed {misconception.count} times</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
