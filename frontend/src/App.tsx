import { useState } from "react";
import "@xyflow/react/dist/style.css";
import { DashboardPage } from "./pages/DashboardPage";
import { TwinGraphPage } from "./pages/TwinGraphPage";
import { useLearningTwin } from "./hooks/useLearningTwin";

type Tab = "dashboard" | "graph";

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { data, loading, error, refresh } = useLearningTwin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-cyan-100 p-4 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-2xl bg-base-900 p-5 text-white shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Hackathon MVP</p>
          <h1 className="text-3xl font-semibold">Learning Twin</h1>
          <p className="mt-2 text-sm text-slate-200">
            AI-powered student state modeling with mastery tracking, forgetting prediction, and next-step guidance.
          </p>
        </header>

        <div className="mb-5 flex gap-2">
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "dashboard" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
            }`}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "graph" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
            }`}
            onClick={() => setTab("graph")}
          >
            Learning Twin Graph
          </button>
        </div>

        {loading && <p className="text-sm text-slate-600">Loading learning twin...</p>}
        {error && <p className="rounded-lg bg-rose-100 p-3 text-sm text-rose-700">{error}</p>}

        {data && !loading && !error && (
          <main className="transition-all duration-300 ease-out">
            {tab === "dashboard" ? (
              <DashboardPage
                studentState={data.studentState}
                twin={data.learningTwin}
                onSimulated={refresh}
              />
            ) : (
              <TwinGraphPage concepts={data.concepts} studentState={data.studentState} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
