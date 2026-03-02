import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { useMemo, useState } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { fetchRecommendations, uploadWorkbook } from './api';
import type { LearningGoal, StudentProfile, StudyRecommendation } from './types';

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip
);

const initialGoal: LearningGoal = {
  targetScore: 90,
  targetMonths: 6,
  weeklyStudyHours: 10,
};

const averageMasteryDays = (topics: StudentProfile['insights']['topicInsights']): string => {
  const mastered = topics
    .map((topic) => topic.masteryTimeDays)
    .filter((value): value is number => value !== null);

  if (mastered.length === 0) {
    return 'N/A';
  }

  const avg = mastered.reduce((sum, value) => sum + value, 0) / mastered.length;
  return `${avg.toFixed(1)} days`;
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [goal, setGoal] = useState<LearningGoal>(initialGoal);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);
  const [recommendationSource, setRecommendationSource] = useState<'ai' | 'fallback' | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toPercent = (value: number): string => `${(value * 100).toFixed(0)}%`;
  const scoreTone = (value: number): string => {
    if (value >= 0.85) {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    }
    if (value >= 0.7) {
      return 'bg-amber-50 text-amber-700 ring-amber-100';
    }
    return 'bg-rose-50 text-rose-700 ring-rose-100';
  };

  const upload = async (): Promise<void> => {
    if (!file) {
      setError('Please select an Excel file first.');
      return;
    }

    try {
      setLoadingUpload(true);
      setError(null);
      const uploaded = await uploadWorkbook(file);
      setProfile(uploaded);
      setRecommendations([]);
      setHasGeneratedRecommendations(false);
      setRecommendationSource(null);
      if (uploaded.latestGoal) {
        setGoal(uploaded.latestGoal);
      }
    } catch (uploadError) {
      setError((uploadError as Error).message ?? 'Upload failed.');
    } finally {
      setLoadingUpload(false);
    }
  };

  const generateRecommendations = async (): Promise<void> => {
    if (!profile) {
      setError('Upload and analyze a profile first.');
      return;
    }

    try {
      setLoadingRecommendations(true);
      setError(null);
      const result = await fetchRecommendations(profile.id, goal);
      setRecommendations(result.recommendations);
      setRecommendationSource(result.source);
      setHasGeneratedRecommendations(true);
    } catch (recommendationError) {
      setError((recommendationError as Error).message ?? 'Recommendation generation failed.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const accuracyLineData = useMemo(() => {
    if (!profile) {
      return null;
    }

    return {
      labels: profile.insights.accuracyOverTime.map((point) => point.date),
      datasets: [
        {
          label: 'Accuracy',
          data: profile.insights.accuracyOverTime.map((point) => point.accuracy01),
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.18)',
          tension: 0.25,
          fill: true,
        },
      ],
    };
  }, [profile]);

  const masteryBarData = useMemo(() => {
    if (!profile) {
      return null;
    }

    return {
      labels: profile.insights.topicInsights.map((topic) => topic.topic),
      datasets: [
        {
          label: 'Mastery Time (days)',
          data: profile.insights.topicInsights.map((topic) => topic.masteryTimeDays ?? 0),
          backgroundColor: '#1d4ed8',
          borderRadius: 8,
        },
      ],
    };
  }, [profile]);

  const retentionRadarData = useMemo(() => {
    if (!profile) {
      return null;
    }

    return {
      labels: profile.insights.topicInsights.map((topic) => topic.topic),
      datasets: [
        {
          label: 'Retention Ability',
          data: profile.insights.topicInsights.map((topic) => topic.retention01),
          borderColor: '#ea580c',
          backgroundColor: 'rgba(234, 88, 12, 0.2)',
          pointBackgroundColor: '#ea580c',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    };
  }, [profile]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef7ff_50%,#f8fafc_100%)] p-4 text-slate-900 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-700">Digital Learning Twin</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Student Cognitive Modeling Dashboard
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
            Upload a student Excel profile, map learning behavior into a digital brain, and generate goal-aware study
            recommendations.
          </p>

          <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 md:grid-cols-[1fr_auto] md:gap-4 md:p-4">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:shadow-sm">
              <span className="truncate">{file?.name ?? 'Choose Excel file (.xlsx, .xls)'}</span>
              <span className="ml-3 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Browse</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={upload}
              disabled={loadingUpload}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loadingUpload ? 'Analyzing...' : 'Upload and Analyze'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </section>

        {profile && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Accuracy</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{toPercent(profile.insights.overallAccuracy01)}</p>
                <p className="mt-1 text-xs text-slate-500">Average score across all assessments.</p>
              </article>
              <article className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">1. Accuracy Over Time</p>
                <p className="mt-2 text-3xl font-bold text-teal-700">
                  {toPercent(profile.insights.metricScores.accuracyOverTime01)}
                </p>
                <p className="mt-1 text-xs text-slate-500">How consistently the student performs over time.</p>
              </article>
              <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">2. Time to Mastery</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {averageMasteryDays(profile.insights.topicInsights)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Average time needed to master a topic.</p>
              </article>
              <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">3. Retention Ability</p>
                <p className="mt-2 text-3xl font-bold text-orange-700">{toPercent(profile.insights.metricScores.retention01)}</p>
                <p className="mt-1 text-xs text-slate-500">How well scores stay stable after time gaps.</p>
              </article>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Accuracy Over Time</h2>
                <p className="mb-3 mt-1 text-sm text-slate-500">Monthly average performance trend.</p>
                {accuracyLineData && <Line data={accuracyLineData} />}
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Time to Mastery by Topic</h2>
                <p className="mb-3 mt-1 text-sm text-slate-500">Days from first attempt to mastery for each topic.</p>
                {masteryBarData && <Bar data={masteryBarData} />}
              </article>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold text-slate-900">Topic Insights</h2>
                <p className="mb-2 mt-1 text-sm text-slate-500">Quick view of accuracy, mastery time, and retention by topic.</p>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-semibold">Topic</th>
                        <th className="px-4 font-semibold">Accuracy Over Time</th>
                        <th className="px-4 font-semibold">Time to Mastery (Days)</th>
                        <th className="px-4 font-semibold">Retention Ability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.insights.topicInsights.map((topic) => (
                        <tr key={topic.topic} className="border-b border-slate-100 text-slate-700 odd:bg-white even:bg-slate-50/45">
                          <td className="px-4 py-3 font-medium capitalize">{topic.topic}</td>
                          <td className="px-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scoreTone(topic.accuracy01)}`}>
                              {toPercent(topic.accuracy01)}
                            </span>
                          </td>
                          <td className="px-4">{topic.masteryTimeDays === null ? 'Not reached' : topic.masteryTimeDays.toFixed(1)}</td>
                          <td className="px-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scoreTone(topic.retention01)}`}>
                              {toPercent(topic.retention01)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Retention Ability by Topic</h2>
                <p className="mb-3 mt-1 text-sm text-slate-500">Farther from the center means stronger retention.</p>
                {retentionRadarData && (
                  <div className="h-[300px]">
                    <Radar
                      data={retentionRadarData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          r: {
                            min: 0,
                            max: 1,
                            ticks: {
                              stepSize: 0.2,
                              backdropColor: 'transparent',
                              color: '#94a3b8',
                            },
                            grid: {
                              color: 'rgba(100, 116, 139, 0.2)',
                            },
                            angleLines: {
                              color: 'rgba(100, 116, 139, 0.2)',
                            },
                            pointLabels: {
                              color: '#334155',
                              font: {
                                size: 12,
                                weight: 600,
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Goal Setting and Study Plan</h2>
              <p className="mt-1 text-sm text-slate-500">Set targets and generate personalized action plans.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  Target Score
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={goal.targetScore}
                    onChange={(event) => setGoal((prev) => ({ ...prev, targetScore: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Time Horizon (months)
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={goal.targetMonths}
                    onChange={(event) => setGoal((prev) => ({ ...prev, targetMonths: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Weekly Study Hours
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={goal.weeklyStudyHours}
                    onChange={(event) => setGoal((prev) => ({ ...prev, weeklyStudyHours: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={generateRecommendations}
                disabled={loadingRecommendations}
                className="mt-5 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:from-teal-300 disabled:to-cyan-300"
              >
                {loadingRecommendations ? 'Generating...' : 'Generate Recommendations'}
              </button>

              {!hasGeneratedRecommendations && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Set your goal values, then click <span className="font-semibold text-slate-900">Generate Recommendations</span> to call the AI coach.
                </div>
              )}

              {hasGeneratedRecommendations && (
                <div className="mt-6">
                  <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {recommendationSource === 'ai' ? 'Source: OpenAI model' : 'Source: Fallback rules'}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                  {recommendations.map((recommendation) => (
                    <article
                      key={recommendation.title}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
                    >
                      <h3 className="font-semibold text-slate-900">{recommendation.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{recommendation.why}</p>
                      <p className="mt-2 text-sm font-medium text-teal-700">{recommendation.action}</p>
                    </article>
                  ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default App;
