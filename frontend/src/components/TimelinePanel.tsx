import type { TimelineEvent } from "../types";

type TimelinePanelProps = {
  timeline: TimelineEvent[];
};

const formatDelta = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
};

export const TimelinePanel = ({ timeline }: TimelinePanelProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">What Changed</h3>
      <p className="text-sm text-slate-500">Recent learning-state transitions after each interaction.</p>

      <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet. Simulate practice to populate timeline.</p>
        ) : (
          timeline.map((event) => (
            <div key={`${event.timestamp}-${event.conceptId}`} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">{event.conceptId}</p>
              <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                <span>Mastery: {formatDelta(event.masteryDelta)}</span>
                <span>Retention: {formatDelta(event.retentionDelta)}</span>
                <span>Effective: {formatDelta(event.effectiveMasteryDelta)}</span>
                <span>
                  Rank shift: {event.recommendationShift === null ? "-" : `${event.recommendationShift > 0 ? "+" : ""}${event.recommendationShift}`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
