"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CreditCard, FileText, Link, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import { ExamLauncher } from "@/frontend/features/exams/exam-launcher";
import { LogoutButton } from "@/frontend/features/navigation/logout-button";
import type { Exam, Insight, SafeUser, SubscriptionPlanConfig, Tier } from "@/backend/shared/types";
import { subjectLabel } from "@/backend/shared/utils";
import type { PerformanceRow } from "@/backend/analytics/performance";

type ParentData = {
  user: SafeUser;
  students: SafeUser[];
  selectedStudent?: SafeUser;
  exams: Exam[];
  insight?: Insight;
  plan: SubscriptionPlanConfig;
  performance: {
    subjects: PerformanceRow[];
    topics: PerformanceRow[];
    strengths: PerformanceRow[];
    positives: PerformanceRow[];
    focusAreas: PerformanceRow[];
  };
};

const chartColors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#e11d48", "#8b5cf6"];

export function ParentDashboard() {
  const [data, setData] = useState<ParentData | null>(null);
  const [billing, setBilling] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [studentError, setStudentError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/parent")
      .then((response) => {
        if (response.status === 401) location.href = "/";
        return response.json();
      })
      .then(setData);
  }, []);

  const trend = useMemo(() => (data?.exams ?? []).map((exam, index) => ({
    name: `Exam ${index + 1}`,
    score: exam.score ?? 0
  })), [data]);

  const topics = useMemo(() => (data?.performance.topics ?? []).slice(0, 10), [data]);
  const subjects = useMemo(() => data?.performance.subjects ?? [], [data]);

  const average = useMemo(() => {
    if (!data?.exams.length) return 0;
    return Math.round(data.exams.reduce((sum, exam) => sum + (exam.score ?? 0), 0) / data.exams.length);
  }, [data]);

  const readiness = useMemo(() => [{ name: "Readiness", value: average, fill: average >= 75 ? "#10b981" : average >= 55 ? "#f59e0b" : "#e11d48" }], [average]);

  async function checkout(tier: Tier) {
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier })
    });
    const json = await response.json();
    if (json.url) location.href = json.url;
    else setBilling(json.message ?? "Billing demo mode");
  }

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStudentMessage("");
    setStudentError("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/parent/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      })
    });
    const json = await response.json();
    if (!response.ok) {
      setStudentError(json.error ?? "Could not link student");
      return;
    }
    setStudentMessage(json.message ?? "Student linked.");
    setData((current) => current ? {
      ...current,
      students: [...current.students, json.student],
      selectedStudent: current.selectedStudent ?? json.student
    } : current);
    event.currentTarget.reset();
  }

  if (!data) return <main className="app-shell p-6">Loading dashboard...</main>;
  const insight = data.insight?.insightContent as { summary?: string; strengths?: string[]; focusAreas?: string[]; plan?: string[] };

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-6">
        <header className="surface mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
          <div>
            <p className="eyebrow">Parent command centre</p>
            <h1 className="mt-1 text-3xl font-black">Welcome, {data.user.firstName}</h1>
            <p className="text-ink/65">Tracking {data.selectedStudent?.firstName ?? "your student"} with analytics, coaching plans, and exam evidence.</p>
          </div>
          <LogoutButton />
        </header>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="premium-card p-4">
            <div className="flex items-center justify-between text-sm font-bold text-ink/60"><span>Average</span><TrendingUp size={18} /></div>
            <p className="mt-3 text-3xl font-black">{average}%</p>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between text-sm font-bold text-ink/60"><span>Completed</span><FileText size={18} /></div>
            <p className="mt-3 text-3xl font-black">{data.exams.length}</p>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between text-sm font-bold text-ink/60"><span>Students</span><Users size={18} /></div>
            <p className="mt-3 text-3xl font-black">{data.students.length}</p>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between text-sm font-bold text-ink/60"><span>Tier</span><Sparkles size={18} /></div>
            <p className="mt-3 text-3xl font-black">{data.user.subscriptionTier}</p>
          </div>
        </div>

        {data.students.length === 0 && (
          <section className="premium-card mb-4 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-teal/10 p-2 text-teal"><Link size={22} /></div>
              <div>
                <p className="eyebrow">Student setup</p>
                <h2 className="mt-1 text-2xl font-black">Link Devansh or another student</h2>
                <p className="mt-1 text-sm leading-6 text-ink/65">Create a verified student account so exams, progress, rewards, and parent analytics are connected to your family account.</p>
              </div>
            </div>
            <form className="mt-4 grid gap-3 md:grid-cols-5" onSubmit={createStudent}>
              <input className="field" name="firstName" placeholder="Student first name" defaultValue="Devansh" required />
              <input className="field" name="lastName" placeholder="Student last name" defaultValue="Ingwale" required />
              <input className="field md:col-span-2" name="email" type="email" placeholder="Student real email" required />
              <input className="field" name="password" type="password" minLength={8} placeholder="Password" required />
              <Button className="md:col-span-5" type="submit">Create and link student</Button>
            </form>
            {studentMessage && <p className="mt-3 rounded-md bg-teal/10 p-3 text-sm font-semibold text-teal">{studentMessage}</p>}
            {studentError && <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">{studentError}</p>}
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <section className="chart-card">
            <div className="mb-3 flex items-center gap-2 font-black"><TrendingUp size={18} /> Score Trend</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="scoreTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,32,51,.08)" />
                  <XAxis dataKey="name" tickLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fill="url(#scoreTrend)" dot={{ r: 4, fill: "#4f46e5" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-card">
            <div className="mb-3 flex items-center gap-2 font-black"><Target size={18} /> Readiness and subject accuracy</div>
            <div className="grid gap-3 md:grid-cols-[170px_1fr]">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="72%" outerRadius="100%" data={readiness} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#eef2ff" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="-mt-32 text-center">
                  <p className="text-3xl font-black">{average}%</p>
                  <p className="text-xs font-black uppercase text-ink/45">Readiness</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjects}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,32,51,.08)" />
                    <XAxis dataKey="label" tickLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                      {subjects.map((subject, index) => <Cell key={subject.key} fill={chartColors[index % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="chart-card lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 font-black"><Target size={18} /> Topic Breakdown</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topics} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,32,51,.08)" />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} />
                  <YAxis type="category" dataKey="label" width={126} tickLine={false} />
                  <Tooltip labelFormatter={(_, rows) => rows?.[0]?.payload?.label ?? "Topic"} />
                  <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                    {topics.map((topic, index) => <Cell key={topic.key} fill={chartColors[(index + 1) % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="premium-card p-4">
            <h2 className="font-black">AI Readiness Signals</h2>
            <div className="mt-3 space-y-3">
              {(data.performance.strengths.length ? data.performance.strengths : []).map((item) => (
                <div key={item.key} className="rounded-md border border-teal/20 bg-teal/10 p-3">
                  <p className="text-xs font-black uppercase text-teal">Strong area</p>
                  <p className="mt-1 font-black">{item.label}</p>
                  <p className="text-sm text-ink/65">{item.accuracy}% accuracy across {item.total} question{item.total === 1 ? "" : "s"}</p>
                </div>
              ))}
              {(data.performance.focusAreas.length ? data.performance.focusAreas : []).slice(0, 3).map((item) => (
                <div key={item.key} className="rounded-md border border-coral/20 bg-coral/10 p-3">
                  <p className="text-xs font-black uppercase text-coral">Focus next</p>
                  <p className="mt-1 font-black">{item.label}</p>
                  <p className="text-sm text-ink/65">{item.accuracy}% accuracy. Add targeted practice before the next full paper.</p>
                </div>
              ))}
              {!data.performance.strengths.length && !data.performance.focusAreas.length && (
                <p className="rounded-md bg-white p-3 text-sm font-semibold text-ink/60">Complete a marked paper to unlock subject and topic signals.</p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="premium-card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 font-black"><Sparkles size={18} /> AI Study Plan</div>
            <p className="mt-3 text-lg leading-8 text-ink/72">{insight?.summary ?? "Complete an exam to unlock richer AI analysis."}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(insight?.plan ?? ["Launch a timed exam", "Review flagged questions", "Practise weak micro-topics"]).map((item) => (
                <div key={item} className="rounded-md border border-ink/10 bg-white/80 p-3 text-sm font-semibold leading-6 shadow-sm">{item}</div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            {data.selectedStudent ? (
              <ExamLauncher
                plan={data.plan}
                customAllowed={data.plan.customExamEnabled}
                proctorAllowed={data.plan.features.SECURE_PROCTORING}
              />
            ) : (
              <div className="premium-card p-4">
                <h2 className="font-black">Exam launcher locked</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">Create and link a student profile before launching parent-managed exams.</p>
              </div>
            )}
            <div className="premium-card p-4">
              <h2 className="flex items-center gap-2 font-black"><CreditCard size={18} /> Billing</h2>
              <p className="my-3 text-sm leading-6 text-ink/65">Stripe-ready checkout switches from demo to live when keys are configured.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => checkout("ALPHA")}>Alpha</Button>
                <Button className="bg-teal" onClick={() => checkout("APEX")}>Apex</Button>
              </div>
              {billing && <p className="mt-3 rounded-md bg-skysoft p-3 text-sm font-semibold text-teal">{billing}</p>}
            </div>
          </section>
        </div>

        <section className="premium-card mt-4 p-4">
          <h2 className="font-black">Recent Exams</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-ink/55">
                <tr><th className="px-3 py-2">Subject</th><th>Score</th><th>Status</th><th>Completed</th></tr>
              </thead>
              <tbody>
                {data.exams.map((exam) => (
                  <tr key={exam.id} className="bg-white">
                    <td className="rounded-l-md px-3 py-3 font-bold">{subjectLabel(exam.subject)}</td>
                    <td>{exam.score ?? "-"}%</td>
                    <td><span className="chip">{exam.status}</span></td>
                    <td className="rounded-r-md">{exam.completedAt ? new Date(exam.completedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
