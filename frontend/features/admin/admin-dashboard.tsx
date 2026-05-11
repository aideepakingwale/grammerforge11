"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, BarChart3, BookOpen, CheckCircle2, CreditCard, FileText, KeyRound, Users, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UsersPanel } from "@/frontend/features/admin/panels/users-panel";
import { ConfigPanel } from "@/frontend/features/admin/panels/config-panel";
import { PlansPanel } from "@/frontend/features/admin/panels/plans-panel";
import { QuestionsPanel } from "@/frontend/features/admin/panels/questions-panel";
import { ReportsPanel } from "@/frontend/features/admin/panels/reports-panel";
import { PagesPanel } from "@/frontend/features/admin/panels/pages-panel";
import type { PlatformAnalytics, PlatformConfig, PublicPage, QuestionBankStats, QuestionGenerationJob, QuestionGenerationSchedule, SafeUser, SubscriptionPlanConfig } from "@/backend/shared/types";

type AdminData = {
  analytics: PlatformAnalytics;
  users: SafeUser[];
  config: PlatformConfig;
  plans: SubscriptionPlanConfig[];
  pages: PublicPage[];
  questionGeneration?: {
    stats: QuestionBankStats;
    llmQuota: PlatformConfig["llmQuota"];
    schedule: QuestionGenerationSchedule;
    jobs: QuestionGenerationJob[];
  };
};

const tabs = [
  ["users", "Users", Users],
  ["config", "Config", KeyRound],
  ["plans", "Plans", CreditCard],
  ["questions", "Questions", Wand2],
  ["reports", "Reports", BarChart3],
  ["pages", "Pages", FileText]
] as const;


export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [active, setActive] = useState<(typeof tabs)[number][0]>("users");
  const [notice, setNotice] = useState("");

  async function load(signal?: AbortSignal) {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Could not load admin dashboard");
    if (signal?.aborted) return;
    setData(await response.json());
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/dashboard", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load admin dashboard");
        return response.json() as Promise<AdminData>;
      })
      .then((payload) => setData(payload))
      .catch(() => {
        if (!controller.signal.aborted) setNotice("Could not load admin dashboard");
      });
    return () => controller.abort();
  }, []);

  async function mutate(url: string, options: RequestInit, success: string) {
    setNotice("");
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(json.error ?? "Admin action failed");
      return;
    }
    setNotice(success);
    await load();
  }

  const stats = useMemo<Array<[string, string | number, LucideIcon]>>(() => {
    if (!data) return [];
    return [
      ["Users", data.analytics.totalUsers, Users],
      ["Active subscriptions", data.analytics.activeSubscriptions, CreditCard],
      ["Exams completed", data.analytics.examsCompleted, BookOpen],
      ["Average score", `${data.analytics.averageScore}%`, Activity]
    ];
  }, [data]);

  if (!data && notice) {
    return (
      <main className="min-h-screen bg-paper p-6 text-ink">
        <div className="mx-auto max-w-xl rounded-lg border border-coral/20 bg-white p-5 shadow-soft">
          <h1 className="text-2xl font-black">Admin console could not load</h1>
          <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">{notice}</p>
          <Link className="mt-4 inline-flex min-h-10 items-center rounded-md bg-teal px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#1b5aa6]" href="/">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="min-h-screen bg-paper p-6 font-bold text-ink">Loading superadmin console...</main>;
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <section className="mx-auto max-w-7xl">
        <header className="page-header p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-teal/20 bg-skysoft px-2.5 py-1 text-xs font-black uppercase text-teal">
                <CheckCircle2 size={14} /> Superadmin console
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">Platform Administration</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">
                Manage users, subscriptions, AI provider settings, package access, platform health, and public content.
              </p>
            </div>
            <div className="rounded-md border border-line bg-white px-4 py-3 shadow-soft">
              <p className="text-xs font-black uppercase text-ink/45">System status</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-black text-moss">
                <span className="h-2.5 w-2.5 rounded-full bg-moss shadow-[0_0_0_4px_rgba(47,179,68,0.12)]" />
                {data.analytics.uptimeStatus}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {stats.map(([label, value, Icon]) => (
            <div key={label as string} className="stat-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink/55">{label as string}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight">{value as string}</p>
                </div>
                <span className="rounded-md bg-skysoft p-2 text-teal">
                  <Icon size={20} />
                </span>
              </div>
            </div>
          ))}
        </div>

        <nav className="mt-4 flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1.5 shadow-soft">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`admin-tab ${active === id ? "admin-tab-active" : ""}`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        {notice && <p className="mt-4 rounded-md border border-gold/30 bg-gold/10 p-3 text-sm font-bold text-ink">{notice}</p>}

        <section className="mt-4">
          {active === "users" && <UsersPanel users={data.users} mutate={mutate} />}
          {active === "config" && <ConfigPanel config={data.config} mutate={mutate} />}
          {active === "plans" && <PlansPanel key={data.plans.map((plan) => plan.updatedAt).join(":")} plans={data.plans} mutate={mutate} />}
          {active === "questions" && <QuestionsPanel initial={data.questionGeneration} mutate={mutate} />}
          {active === "reports" && <ReportsPanel analytics={data.analytics} />}
          {active === "pages" && <PagesPanel pages={data.pages} mutate={mutate} />}
        </section>
      </section>
    </main>
  );
}
