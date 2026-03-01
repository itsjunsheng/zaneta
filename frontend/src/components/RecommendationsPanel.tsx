import type { Recommendation } from "../types";

type RecommendationsPanelProps = {
  recommendations: Recommendation[];
};

const scoreToPercent = (score: number) => Math.round(score * 100);

export const RecommendationsPanel = ({ recommendations }: RecommendationsPanelProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">Top Study Actions</h3>
      <div className="mt-3 space-y-3">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.conceptId}
            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{recommendation.conceptName}</p>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white">
                Priority {scoreToPercent(recommendation.score)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{recommendation.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
