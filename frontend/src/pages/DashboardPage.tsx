import { StatCard } from "../components/StatCard";
import { MasteryChart } from "../components/MasteryChart";
import { RecommendationsPanel } from "../components/RecommendationsPanel";
import { AICoachPanel } from "../components/AICoachPanel";
import { SimulationPanel } from "../components/SimulationPanel";
import { ForgettingRiskPanel } from "../components/ForgettingRiskPanel";
import type { LearningTwinResponse, StudentState } from "../types";

type DashboardPageProps = {
  studentState: StudentState[];
  twin: LearningTwinResponse;
  onSimulated: () => Promise<void>;
};

export const DashboardPage = ({ studentState, twin, onSimulated }: DashboardPageProps) => {
  const avgMastery =
    studentState.reduce((sum, item) => sum + item.effectiveMastery, 0) / Math.max(studentState.length, 1);

  const highRiskCount = studentState.filter((item) => 1 - item.retention > 0.5).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Average Effective Mastery"
          value={`${Math.round(avgMastery * 100)}%`}
          subtext="Weighted by retention"
        />
        <StatCard
          label="High Forgetting Risk"
          value={`${highRiskCount}`}
          subtext="Concepts needing spaced review"
        />
        <StatCard
          label="Interactions Logged"
          value={`${studentState.reduce((sum, item) => sum + item.attempts, 0)}`}
          subtext="Cumulative practice attempts"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <MasteryChart studentState={studentState} />
        <div className="space-y-5">
          <ForgettingRiskPanel studentState={studentState} />
          <RecommendationsPanel recommendations={twin.recommendations} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SimulationPanel onSimulated={onSimulated} />
        <AICoachPanel explanation={twin.explanation} misconceptions={twin.misconceptions} />
      </div>
    </div>
  );
};
