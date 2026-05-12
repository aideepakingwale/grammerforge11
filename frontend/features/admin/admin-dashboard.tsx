"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, AlertCircle, BarChart3, BookCheck, BookOpen, CheckCircle2, CreditCard, DatabaseZap, FileText, GraduationCap, KeyRound, Mail, School, Server, ShieldCheck, Sparkles, UserRoundCheck, Users, Wand2, WalletCards, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UsersPanel } from "@/frontend/features/admin/panels/users-panel";
import { ConfigPanel } from "@/frontend/features/admin/panels/config-panel";
import { PlansPanel } from "@/frontend/features/admin/panels/plans-panel";
import { QuestionsPanel } from "@/frontend/features/admin/panels/questions-panel";
import { ReportsPanel } from "@/frontend/features/admin/panels/reports-panel";
import { PagesPanel } from "@/frontend/features/admin/panels/pages-panel";
import { ExamsPanel } from "@/frontend/features/admin/panels/exams-panel";
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
  ["exams", "Exams", BookCheck],
  ["reports", "Reports", BarChart3],
  ["pages", "Pages", FileText]
] as const;

const stackItems = [
  ["Hosting", "Vercel serverless", Server],
  ["Database", "Neon / Supabase Postgres", DatabaseZap],
  ["Cache", "Upstash Redis", Activity],
  ["AI", "Gemini + Groq switchable", Sparkles],
  ["Payments", "Stripe", WalletCards],
  ["Email", "Brevo", Mail]
] as const;

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [active, setActive] = useState<(typeof tabs)[number][0]>("users");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "info">("info");

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
        if (!controller.signal.aborted) {
          setNoticeType("error");
          setNotice("Could not load admin dashboard");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 10000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function mutate(url: string, options: RequestInit, success: string) {
    setNotice("");
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNoticeType("error");
      setNotice(json.error ?? "Admin action failed");
      return;
    }
    setNoticeType("success");
    setNotice(success);
    await load();
  }

  const stats = useMemo<Array<[string, string | number, LucideIcon, string]>>(() => {
    if (!data) return [];
    return [
      ["Students", data.analytics.students, GraduationCap, "Learner accounts"],
      ["Parents", data.analytics.parents, UserRoundCheck, "Guardian accounts"],
      ["Admins", data.analytics.admins, ShieldCheck, "Operator accounts"],
      ["Exams", data.analytics.examsCompleted, BookCheck, `${data.analytics.examsStarted} started`],
      ["Questions", data.analytics.questionBankSize, BookOpen, "Master bank size"],
      ["Subscriptions", data.analytics.activeSubscriptions, CreditCard, "Paid or upgraded"]
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
      {notice && <AdminToast message={notice} type={noticeType} onClose={() => setNotice("")} />}
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

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stats.map(([label, value, Icon, sub]) => (
            <div key={label as string} className="stat-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink/55">{label as string}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight">{value as string}</p>
                  <p className="mt-1 text-xs font-semibold text-ink/40">{sub}</p>
                </div>
                <span className="rounded-md bg-skysoft p-2 text-teal">
                  <Icon size={20} />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-white/90 p-4 shadow-soft">
            <div className="flex items-center gap-2"><School className="text-teal" size={20} /><h2 className="font-black">Learning activity</h2></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MetricTile label="Started" value={data.analytics.examsStarted} icon={BookOpen} />
              <MetricTile label="Completed" value={data.analytics.examsCompleted} icon={BookCheck} />
              <MetricTile label="Avg score" value={`${data.analytics.averageScore}%`} icon={BarChart3} />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-white/90 p-4 shadow-soft">
            <div className="flex items-center gap-2"><Activity className="text-teal" size={20} /><h2 className="font-black">Platform signals</h2></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MetricTile label="Audit events" value={data.analytics.auditEvents} icon={ShieldCheck} />
              <MetricTile label="AI insights" value={data.analytics.aiInsightsCached} icon={Sparkles} />
              <MetricTile label="Questions" value={data.analytics.questionBankSize} icon={BookOpen} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {stackItems.map(([label, value, Icon]) => (
            <div key={label} className="rounded-lg border border-line bg-white/90 p-3 shadow-soft">
              <Icon className="text-teal" size={18} />
              <p className="mt-2 text-xs font-black uppercase text-ink/45">{label}</p>
              <p className="mt-1 text-sm font-bold text-ink">{value}</p>
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

        <section className="mt-4">
          {active === "users" && <UsersPanel users={data.users} mutate={mutate} />}
          {active === "config" && <ConfigPanel config={data.config} mutate={mutate} />}
          {active === "plans" && <PlansPanel key={data.plans.map((plan) => plan.updatedAt).join(":")} plans={data.plans} mutate={mutate} />}
          {active === "questions" && <QuestionsPanel initial={data.questionGeneration} mutate={mutate} />}
          {active === "exams" && <ExamsPanel mutate={mutate} />}
          {active === "reports" && <ReportsPanel analytics={data.analytics} />}
          {active === "pages" && <PagesPanel pages={data.pages} mutate={mutate} />}
        </section>
      </section>
    </main>
  );
}

function AdminToast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  const tone = type === "error"
    ? "border-coral/30 bg-white text-coral"
    : type === "success"
      ? "border-moss/25 bg-white text-moss"
      : "border-teal/25 bg-white text-teal";
  return (
    <div className={`fixed right-4 top-4 z-50 flex max-w-md items-start gap-3 rounded-lg border p-4 shadow-[0_18px_48px_rgba(23,32,51,0.18)] ${tone}`} role="status" aria-live="polite">
      <Icon className="mt-0.5 shrink-0" size={20} />
      <p className="min-w-0 flex-1 text-sm font-bold leading-5 text-ink">{message}</p>
      <button type="button" className="rounded-md p-1 text-ink/45 transition hover:bg-ink/5 hover:text-ink" onClick={onClose} aria-label="Dismiss notification">
        <X size={17} />
      </button>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <Icon className="text-teal" size={17} />
      <p className="mt-2 text-lg font-black">{value}</p>
      <p className="text-xs font-bold text-ink/45">{label}</p>
    </div>
  );
}
