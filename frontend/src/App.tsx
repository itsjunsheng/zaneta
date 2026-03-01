import "@xyflow/react/dist/style.css";
import { DashboardPage } from "./pages/DashboardPage";
import { useLearningTwin } from "./hooks/useLearningTwin";

function App() {
  const { data, loading, error, refresh } = useLearningTwin();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#f8fafc_35%,_#e0f2fe_100%)] p-4 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Learning Twin 2.0</p>
          <h1 className="mt-1 text-4xl font-semibold text-slate-900">Predictive Study Copilot</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            An adaptive twin that models learning state, simulates competing study strategies, and gives interactive coaching to maximize readiness.
          </p>
        </header>

        {loading && <p className="text-sm text-slate-600">Booting Learning Twin Strategy Lab...</p>}
        {error && <p className="rounded-lg bg-rose-100 p-3 text-sm text-rose-700">{error}</p>}

        {data && !loading && !error ? (
          <main className="pb-6 transition-all duration-300 ease-out">
            <DashboardPage studentState={data.studentState} twin={data.learningTwin} onSimulated={refresh} />
          </main>
        ) : null}
      </div>
    </div>
  );
}

export default App;
