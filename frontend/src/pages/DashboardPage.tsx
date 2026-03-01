import { StatCard } from "../components/StatCard";
import { MasteryChart } from "../components/MasteryChart";
import { RecommendationsPanel } from "../components/RecommendationsPanel";
import { AICoachPanel } from "../components/AICoachPanel";
import { SimulationPanel } from "../components/SimulationPanel";
import { ForgettingRiskPanel } from "../components/ForgettingRiskPanel";
import { InterventionPanel } from "../components/InterventionPanel";
import { TimelinePanel } from "../components/TimelinePanel";
import { PersonaPanel } from "../components/PersonaPanel";
import { StrategyArenaPanel } from "../components/StrategyArenaPanel";
import { LearningTwinGraph } from "../components/LearningTwinGraph";
import { api } from "../api/client";
import type { CoachChatMessage, LearningTwinResponse, StudentState } from "../types";

type DashboardPageProps = {
  studentState: StudentState[];
  twin: LearningTwinResponse;
  onSimulated: () => Promise<void>;
};

export const DashboardPage = ({ studentState, twin, onSimulated }: DashboardPageProps) => {
  const avgMastery =
    studentState.reduce((sum, item) => sum + item.effectiveMastery, 0) / Math.max(studentState.length, 1);

  const highRiskCount = studentState.filter((item) => 1 - item.retention > 0.5).length;
  const avgConfidence =
    studentState.reduce((sum, item) => sum + item.confidence, 0) / Math.max(studentState.length, 1);

  const askCoach = async (message: string, history: CoachChatMessage[]) => {
    return api.postCoachChat({ message, history });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-600 to-blue-700 p-5 text-white shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Mission Control</p>
        <h2 className="mt-1 text-2xl font-semibold">Your Learning Twin Strategy Lab</h2>
        <p className="mt-2 text-sm text-cyan-100">
          Not just tracking performance. This twin predicts outcomes, tests rival plans, and coaches next moves in real time.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Effective Mastery"
          value={`${Math.round(avgMastery * 100)}%`}
          subtext="Current retention-aware level"
        />
        <StatCard
          label="High Risk Concepts"
          value={`${highRiskCount}`}
          subtext="Need immediate refresh"
        />
        <StatCard
          label="Model Confidence"
          value={`${Math.round(avgConfidence * 100)}%`}
          subtext="Stability of current estimate"
        />
        <StatCard
          label="7-Day Projection"
          value={`${Math.round(twin.projection.projectedReadiness * 100)}%`}
          subtext={`+${Math.round(twin.projection.expectedImprovement * 100)} pts`}
        />
        <StatCard
          label="Live Interactions"
          value={`${studentState.reduce((sum, item) => sum + item.attempts, 0)}`}
          subtext="Signals feeding the twin"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <StrategyArenaPanel days={10} />
        <PersonaPanel persona={twin.persona} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <MasteryChart studentState={studentState} />
          <div className="h-[340px] rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
            <LearningTwinGraph concepts={twin.conceptGraph} state={studentState} />
          </div>
        </div>
        <div className="space-y-5">
          <RecommendationsPanel recommendations={twin.recommendations} />
          <ForgettingRiskPanel studentState={studentState} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SimulationPanel onSimulated={onSimulated} />
        <AICoachPanel coach={twin.coach} misconceptions={twin.misconceptions} onAsk={askCoach} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <InterventionPanel plans={twin.interventions} />
        <TimelinePanel timeline={twin.timeline} />
      </div>
    </div>
  );
};
