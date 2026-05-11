"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Database, Shield, Users } from "lucide-react";
import type { PlatformAnalytics } from "@/backend/shared/types";

const chartColors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#e11d48", "#8b5cf6"];

export function ReportsPanel({ analytics }: { analytics: PlatformAnalytics }) {
  const rows = [
    ["Students", analytics.students],
    ["Parents", analytics.parents],
    ["Admins", analytics.admins],
    ["Exams started", analytics.examsStarted],
    ["Audit events", analytics.auditEvents],
    ["AI insights cached", analytics.aiInsightsCached],
    ["Question bank size", analytics.questionBankSize]
  ];

  const userMix = [
    { name: "Students", value: analytics.students },
    { name: "Parents", value: analytics.parents },
    { name: "Admins", value: analytics.admins }
  ];
  const examFunnel = [
    { name: "Started", value: analytics.examsStarted },
    { name: "Completed", value: analytics.examsCompleted },
    { name: "Audit events", value: analytics.auditEvents }
  ];
  const platformAssets = [
    { name: "Question bank", value: analytics.questionBankSize },
    { name: "AI insights", value: analytics.aiInsightsCached },
    { name: "Subscriptions", value: analytics.activeSubscriptions }
  ];

  return (
    <div className="space-y-4">
      <div className="page-header p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Live platform intelligence</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Reports and analytics</h2>
            <p className="mt-1 text-sm font-semibold text-ink/60">Operational view across users, subscriptions, exams, proctoring events, AI cache, and the question bank.</p>
          </div>
          <div className="rounded-md border border-moss/20 bg-mint px-4 py-3 text-right">
            <p className="text-xs font-black uppercase text-moss">Average score</p>
            <p className="mt-1 text-2xl font-black">{analytics.averageScore}%</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label as string} className="stat-card p-4">
            <Database className="text-teal" size={20} />
            <p className="mt-3 text-2xl font-black">{value}</p>
            <p className="text-sm font-bold text-ink/55">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="chart-card">
          <div className="mb-3 flex items-center gap-2 font-black"><Users size={18} /> User mix</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userMix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={4}>
                  {userMix.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {userMix.map((item, index) => (
              <span key={item.name} className="chip"><span className="h-2 w-2 rounded-full" style={{ background: chartColors[index] }} />{item.name}</span>
            ))}
          </div>
        </section>

        <section className="chart-card lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 font-black"><Activity size={18} /> Exam and proctoring activity</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,32,51,.08)" />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {examFunnel.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="chart-card">
        <div className="mb-3 flex items-center gap-2 font-black"><Database size={18} /> Platform assets</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformAssets} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,32,51,.08)" />
              <XAxis type="number" tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {platformAssets.map((entry, index) => <Cell key={entry.name} fill={chartColors[(index + 3) % chartColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="accent-panel rounded-md p-4">
        <div className="flex items-center gap-2 font-black text-teal"><Shield size={18} /> Current platform status</div>
        <p className="mt-2 text-sm font-semibold text-ink/65">API routes, question generation, dashboards, and admin controls are operational in this environment.</p>
      </div>
    </div>
  );
}
