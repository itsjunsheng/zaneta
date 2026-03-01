import { LearningTwinGraph } from "../components/LearningTwinGraph";
import type { Concept, StudentState } from "../types";

type TwinGraphPageProps = {
  concepts: Concept[];
  studentState: StudentState[];
};

export const TwinGraphPage = ({ concepts, studentState }: TwinGraphPageProps) => {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Learning Twin Graph</h2>
        <p className="text-sm text-slate-500">
          Node fill represents mastery. Border color indicates forgetting risk.
        </p>
      </div>
      <LearningTwinGraph concepts={concepts} state={studentState} />
    </div>
  );
};
