import { useMemo } from "react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";
import type { Concept, StudentState } from "../types";

type LearningTwinGraphProps = {
  concepts: Concept[];
  state: StudentState[];
};

const masteryColor = (mastery: number) => {
  if (mastery < 0.35) return "#fee2e2";
  if (mastery < 0.65) return "#fef9c3";
  return "#dcfce7";
};

const riskBorder = (retention: number) => {
  const risk = 1 - retention;
  if (risk > 0.6) return "#dc2626";
  if (risk > 0.35) return "#ca8a04";
  return "#16a34a";
};

const positions: Record<string, { x: number; y: number }> = {
  Fractions: { x: 0, y: 80 },
  Ratios: { x: 260, y: 80 },
  ProportionalReasoning: { x: 520, y: 80 },
  AlgebraReadiness: { x: 780, y: 80 }
};

export const LearningTwinGraph = ({ concepts, state }: LearningTwinGraphProps) => {
  const stateMap = useMemo(
    () => Object.fromEntries(state.map((entry) => [entry.conceptId, entry])),
    [state]
  );

  const nodes: Node[] = concepts.map((concept) => {
    const conceptState = stateMap[concept.id];
    const fill = masteryColor(conceptState?.mastery ?? 0);
    const border = riskBorder(conceptState?.retention ?? 1);

    return {
      id: concept.id,
      position: positions[concept.id] ?? { x: 0, y: 0 },
      data: {
        label: (
          <div className="w-44 text-left">
            <p className="font-semibold text-slate-900">{concept.name}</p>
            <p className="text-xs text-slate-600">Mastery: {Math.round((conceptState?.mastery ?? 0) * 100)}%</p>
            <p className="text-xs text-slate-600">Retention: {Math.round((conceptState?.retention ?? 1) * 100)}%</p>
          </div>
        )
      },
      style: {
        borderRadius: 12,
        border: `2px solid ${border}`,
        background: fill,
        padding: 10,
        width: 190
      }
    };
  });

  const edges: Edge[] = concepts.flatMap((concept) =>
    concept.prerequisites.map((prereq) => ({
      id: `${prereq}-${concept.id}`,
      source: prereq,
      target: concept.id,
      animated: true,
      style: { stroke: "#334155", strokeWidth: 1.4 }
    }))
  );

  return (
    <div className="h-[320px] rounded-xl border border-slate-200 bg-white shadow-card">
      <ReactFlow fitView nodes={nodes} edges={edges}>
        <Background color="#e2e8f0" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
