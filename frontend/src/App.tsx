import axios from 'axios';
import type { Session } from '@supabase/supabase-js';
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
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { fetchProfile, fetchRecommendations } from './api';
import { supabase, supabaseConfigError } from './supabase';
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

const errorMessageOf = (value: unknown, fallback: string): string => {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [goal, setGoal] = useState<LearningGoal>(initialGoal);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);
  const [recommendationSource, setRecommendationSource] = useState<'ai' | 'fallback' | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabaseClient = supabase;
    if (!supabaseClient) {
      setError(supabaseConfigError ?? 'Supabase client is not configured.');
      setLoadingSession(false);
      return;
    }

    let active = true;

    const bootstrapSession = async (): Promise<void> => {
      const { data, error: sessionError } = await supabaseClient.auth.getSession();
      if (!active) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session ?? null);
      setLoadingSession(false);
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event: string, nextSession: Session | null) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setRecommendations([]);
        setHasGeneratedRecommendations(false);
        setRecommendationSource(null);
        setGoal(initialGoal);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setLoadingProfile(false);
      return;
    }

    let active = true;

    const loadProfile = async (): Promise<void> => {
      try {
        setLoadingProfile(true);
        setError(null);

        const fetched = await fetchProfile(accessToken);
        if (!active) {
          return;
        }

        setProfile(fetched);
        setGoal(fetched.latestGoal ?? initialGoal);
        setRecommendations([]);
        setHasGeneratedRecommendations(false);
        setRecommendationSource(null);
      } catch (profileError) {
        if (!active) {
          return;
        }

        if (axios.isAxiosError(profileError) && profileError.response?.status === 404) {
          setProfile(null);
          setRecommendations([]);
          setHasGeneratedRecommendations(false);
          setRecommendationSource(null);
          return;
        }

        setError((profileError as Error).message ?? 'Failed to load dashboard profile.');
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [session?.access_token]);

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

  const submitAuth = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const supabaseClient = supabase;
    if (!supabaseClient) {
      setError(supabaseConfigError ?? 'Supabase client is not configured.');
      return;
    }
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoadingAuth(true);
      setError(null);
      setAuthMessage(null);

      if (authMode === 'login') {
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }
      } else {
        const { data, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        if (signUpError) {
          throw signUpError;
        }

        if (!data.session) {
          setAuthMessage('Account created. Check your email for verification before signing in.');
        } else {
          setAuthMessage('Account created. Loading dashboard...');
        }
      }
    } catch (authError) {
      setError(errorMessageOf(authError, 'Authentication failed.'));
    } finally {
      setLoadingAuth(false);
    }
  };

  const signOut = async (): Promise<void> => {
    const supabaseClient = supabase;
    if (!supabaseClient) {
      setError(supabaseConfigError ?? 'Supabase client is not configured.');
      return;
    }
    setLoadingAuth(true);
    setError(null);
    setAuthMessage(null);

    try {
      const { error: signOutError } = await supabaseClient.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const generateRecommendations = async (): Promise<void> => {
    if (!profile || !session?.access_token) {
      setError('Log in and load a profile before generating a report.');
      return;
    }

    try {
      setLoadingRecommendations(true);
      setError(null);
      const result = await fetchRecommendations(session.access_token, goal);
      setRecommendations(result.recommendations);
      setRecommendationSource(result.source);
      setHasGeneratedRecommendations(true);
      setProfile((previous) =>
        previous
          ? {
              ...previous,
              latestGoal: result.goal,
              recommendations: result.recommendations,
            }
          : previous
      );
    } catch (recommendationError) {
      setError((recommendationError as Error).message ?? 'Report generation failed.');
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
            Sign in to load your learning metrics instantly. Generate a goal-aware report only when you need it.
          </p>

          {!session && (
            <form onSubmit={submitAuth} className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="student@example.com"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="••••••••"
                  required
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loadingAuth || loadingSession}
                  className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loadingAuth ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode((mode) => (mode === 'login' ? 'signup' : 'login'))}
                  disabled={loadingAuth || loadingSession}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
                </button>
              </div>
            </form>
          )}

          {session && (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800">{session.user.email}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                disabled={loadingAuth}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sign out
              </button>
            </div>
          )}

          {authMessage && <p className="mt-3 text-sm font-medium text-teal-700">{authMessage}</p>}
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </section>

        {session && loadingProfile && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading student dashboard...
          </section>
        )}

        {session && !loadingProfile && !profile && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No stored stats were found for this account yet. Add profile data to Supabase first, then refresh.
          </section>
        )}

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
              <h2 className="text-xl font-bold text-slate-900">Goal Setting and Study Report</h2>
              <p className="mt-1 text-sm text-slate-500">Set targets and generate a personalized report on demand.</p>
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
                {loadingRecommendations ? 'Generating...' : 'Generate Report'}
              </button>

              {!hasGeneratedRecommendations && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Set your goal values, then click <span className="font-semibold text-slate-900">Generate Report</span> to call the AI coach.
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
