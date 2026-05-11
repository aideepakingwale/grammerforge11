"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CreditCard,
  Database,
  FileText,
  KeyRound,
  Save,
  Shield,
  ToggleLeft,
  Trash2,
  Users,
  Wand2,
  CalendarClock
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type {
  PlatformAnalytics,
  PlatformConfig,
  PublicPage,
  QuestionBankStats,
  QuestionGenerationJob,
  QuestionGenerationSchedule,
  SafeUser,
  SubscriptionPlanConfig
} from "@/backend/shared/types";

type AdminData = {
  analytics: PlatformAnalytics;
  users: SafeUser[];
  config: PlatformConfig;
  plans: SubscriptionPlanConfig[];
  pages: PublicPage[];
  questionGeneration?: {
    stats: QuestionBankStats;
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

const featureLabels: Record<string, string> = {
  STANDARD_EXAMS: "Standard exams",
  AI_SHORT_ANSWER_EVALUATION: "AI short-answer evaluation",
  STEP_BY_STEP_EXPLANATIONS: "Step-by-step explanations",
  BASIC_ANALYTICS: "Basic analytics",
  DEEP_AI_STUDY_PLAN: "Deep AI study plan",
  SECURE_PROCTORING: "Secure proctoring",
  UNLIMITED_TARGETED_EXAMS: "Unlimited targeted exams",
  PREDICTIVE_PASS_SCORE: "Predictive pass score",
  EXTERNAL_AI_PROMPT_HELP: "External AI prompt helper"
};

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

  if (!data) {
    return <main className="min-h-screen bg-paper p-6 font-bold text-ink">Loading superadmin console...</main>;
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-ink/10 bg-ink p-5 text-white shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-mint">Superadmin console</p>
              <h1 className="mt-2 text-3xl font-black">Platform Administration</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                Manage users, subscriptions, AI provider settings, package access, platform health, and public content.
              </p>
            </div>
            <div className="rounded-md bg-white/10 px-4 py-3">
              <p className="text-xs font-black uppercase text-white/50">Status</p>
              <p className="mt-1 text-lg font-black text-mint">{data.analytics.uptimeStatus}</p>
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {stats.map(([label, value, Icon]) => (
            <div key={label as string} className="premium-card p-4">
              <Icon className="text-teal" size={22} />
              <p className="mt-3 text-2xl font-black">{value as string}</p>
              <p className="text-sm font-bold text-ink/55">{label as string}</p>
            </div>
          ))}
        </div>

        <nav className="mt-4 grid gap-2 rounded-lg border border-ink/10 bg-white p-2 shadow-sm md:grid-cols-6">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition ${
                active === id ? "bg-ink text-white" : "bg-paper text-ink/65 hover:text-teal"
              }`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        {notice && <p className="mt-4 rounded-md border border-gold/30 bg-gold/10 p-3 text-sm font-bold text-ink">{notice}</p>}

        <section className="mt-4">
          {active === "users" && <UsersPanel users={data.users} mutate={mutate} />}
          {active === "config" && <ConfigPanel config={data.config} mutate={mutate} />}
          {active === "plans" && <PlansPanel plans={data.plans} mutate={mutate} />}
          {active === "questions" && <QuestionsPanel initial={data.questionGeneration} mutate={mutate} />}
          {active === "reports" && <ReportsPanel analytics={data.analytics} />}
          {active === "pages" && <PagesPanel pages={data.pages} mutate={mutate} />}
        </section>
      </section>
    </main>
  );
}

function UsersPanel({ users, mutate }: { users: SafeUser[]; mutate: (url: string, options: RequestInit, success: string) => Promise<void> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="premium-card overflow-hidden">
        <div className="border-b border-ink/10 p-4">
          <h2 className="text-xl font-black">User administration</h2>
          <p className="text-sm font-semibold text-ink/55">Upgrade plans, change roles, and remove accounts.</p>
        </div>
        <div className="divide-y divide-ink/10">
          {users.map((user) => (
            <form
              key={user.id}
              className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
              action={(formData) => {
                const payload = {
                  firstName: String(formData.get("firstName")),
                  lastName: String(formData.get("lastName")),
                  role: String(formData.get("role")),
                  subscriptionTier: String(formData.get("subscriptionTier"))
                };
                void mutate(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(payload) }, "User updated");
              }}
            >
              <div>
                <p className="text-xs font-black uppercase text-ink/40">{user.email}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input className="field" name="firstName" defaultValue={user.firstName} />
                  <input className="field" name="lastName" defaultValue={user.lastName} />
                </div>
              </div>
              <select className="field" name="role" defaultValue={user.role}>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select className="field" name="subscriptionTier" defaultValue={user.subscriptionTier}>
                <option value="FOUNDATION">Foundation</option>
                <option value="ALPHA">Alpha</option>
                <option value="VELOCITY">Velocity</option>
                <option value="APEX">Apex</option>
              </select>
              <div className="flex gap-2">
                <Button><Save size={16} /> Save</Button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md border border-coral/30 px-3 font-bold text-coral"
                  onClick={() => void mutate(`/api/admin/users/${user.id}`, { method: "DELETE" }, "User deleted")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>

      <form
        className="premium-card p-4"
        action={(formData) => {
          const payload = {
            email: String(formData.get("email")),
            password: String(formData.get("password") || "Password123!"),
            firstName: String(formData.get("firstName")),
            lastName: String(formData.get("lastName")),
            role: String(formData.get("role")),
            subscriptionTier: String(formData.get("subscriptionTier"))
          };
          void mutate("/api/admin/users", { method: "POST", body: JSON.stringify(payload) }, "User created");
        }}
      >
        <h2 className="text-xl font-black">Create user</h2>
        <div className="mt-4 space-y-3">
          <input className="field" name="email" type="email" placeholder="Email" required />
          <input className="field" name="password" type="password" placeholder="Temporary password" />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" name="firstName" placeholder="First name" required />
            <input className="field" name="lastName" placeholder="Last name" required />
          </div>
          <select className="field" name="role" defaultValue="STUDENT">
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select className="field" name="subscriptionTier" defaultValue="FOUNDATION">
            <option value="FOUNDATION">Foundation</option>
            <option value="ALPHA">Alpha</option>
            <option value="VELOCITY">Velocity</option>
            <option value="APEX">Apex</option>
          </select>
          <Button className="w-full"><Users size={16} /> Create account</Button>
        </div>
      </form>
    </div>
  );
}

function ConfigPanel({ config, mutate }: { config: PlatformConfig; mutate: (url: string, options: RequestInit, success: string) => Promise<void> }) {
  return (
    <form
      className="premium-card p-5"
      action={(formData) => {
        const payload = {
          activeLlmProvider: String(formData.get("activeLlmProvider")),
          geminiEnabled: formData.get("geminiEnabled") === "on",
          groqEnabled: formData.get("groqEnabled") === "on",
          redisCacheEnabled: formData.get("redisCacheEnabled") === "on",
          aiDailyLimitFree: Number(formData.get("aiDailyLimitFree")),
          aiDailyLimitPro: Number(formData.get("aiDailyLimitPro")),
          aiDailyLimitPremium: Number(formData.get("aiDailyLimitPremium")),
          maskedGeminiKey: String(formData.get("maskedGeminiKey")),
          maskedGroqKey: String(formData.get("maskedGroqKey")),
          maskedStripeKey: String(formData.get("maskedStripeKey"))
        };
        void mutate("/api/admin/config", { method: "PATCH", body: JSON.stringify(payload) }, "Configuration saved");
      }}
    >
      <h2 className="text-xl font-black">Configuration management</h2>
      <p className="mt-1 text-sm font-semibold text-ink/55">Switch LLM providers and manage masked operational keys.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-black">Active LLM
          <select className="field mt-2" name="activeLlmProvider" defaultValue={config.activeLlmProvider}>
            <option value="GEMINI">Gemini</option>
            <option value="GROQ">Groq</option>
            <option value="INTERNAL">Internal fallback</option>
          </select>
        </label>
        <label className="text-sm font-black">Gemini key
          <input className="field mt-2" name="maskedGeminiKey" defaultValue={config.maskedGeminiKey} />
        </label>
        <label className="text-sm font-black">Groq key
          <input className="field mt-2" name="maskedGroqKey" defaultValue={config.maskedGroqKey} />
        </label>
        <label className="text-sm font-black">Stripe key
          <input className="field mt-2" name="maskedStripeKey" defaultValue={config.maskedStripeKey} />
        </label>
        <label className="text-sm font-black">Foundation AI daily limit
          <input className="field mt-2" name="aiDailyLimitFree" type="number" defaultValue={config.aiDailyLimitFree} />
        </label>
        <label className="text-sm font-black">Alpha AI daily limit
          <input className="field mt-2" name="aiDailyLimitPro" type="number" defaultValue={config.aiDailyLimitPro} />
        </label>
        <label className="text-sm font-black">Apex AI daily limit
          <input className="field mt-2" name="aiDailyLimitPremium" type="number" defaultValue={config.aiDailyLimitPremium} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {[
          ["geminiEnabled", "Gemini enabled", config.geminiEnabled],
          ["groqEnabled", "Groq enabled", config.groqEnabled],
          ["redisCacheEnabled", "Redis cache enabled", config.redisCacheEnabled]
        ].map(([name, label, checked]) => (
          <label key={name as string} className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-black">
            <input name={name as string} type="checkbox" defaultChecked={Boolean(checked)} /> {label as string}
          </label>
        ))}
      </div>
      <Button className="mt-5"><Save size={16} /> Save config</Button>
    </form>
  );
}

function PlansPanel({ plans, mutate }: { plans: SubscriptionPlanConfig[]; mutate: (url: string, options: RequestInit, success: string) => Promise<void> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => (
        <form
          key={plan.tier}
          className="premium-card p-4"
          action={(formData) => {
            const features = Object.fromEntries(Object.keys(plan.features).map((key) => [key, formData.get(key) === "on"]));
            const payload = {
              name: String(formData.get("name")),
              monthlyPricePence: Number(formData.get("monthlyPricePence")),
              examLimitMonthly: String(formData.get("examLimitMonthly") || "") ? Number(formData.get("examLimitMonthly")) : null,
              aiInsightLimitMonthly: String(formData.get("aiInsightLimitMonthly") || "") ? Number(formData.get("aiInsightLimitMonthly")) : null,
              dailySubjectLimit: String(formData.get("dailySubjectLimit") || "") ? Number(formData.get("dailySubjectLimit")) : null,
              questionsPerExam: Number(formData.get("questionsPerExam")),
              durationMinutes: Number(formData.get("durationMinutes")),
              allowAllSubjectsDaily: formData.get("allowAllSubjectsDaily") === "on",
              allowRepeatSubjectSameDay: formData.get("allowRepeatSubjectSameDay") === "on",
              customExamEnabled: formData.get("customExamEnabled") === "on",
              customExamMaxQuestions: Number(formData.get("customExamMaxQuestions")),
              customExamMaxMinutes: Number(formData.get("customExamMaxMinutes")),
              llmCustomExamsPerDay: Number(formData.get("llmCustomExamsPerDay")),
              shareExamEnabled: formData.get("shareExamEnabled") === "on",
              isActive: formData.get("isActive") === "on",
              features
            };
            void mutate(`/api/admin/plans/${plan.tier}`, { method: "PATCH", body: JSON.stringify(payload) }, `${plan.tier} plan updated`);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{plan.tier}</h2>
            <label className="inline-flex items-center gap-2 text-sm font-black">
              <input name="isActive" type="checkbox" defaultChecked={plan.isActive} /> Active
            </label>
          </div>
          <div className="mt-4 space-y-3">
            <input className="field" name="name" defaultValue={plan.name} />
            <input className="field" name="monthlyPricePence" type="number" defaultValue={plan.monthlyPricePence} />
            <input className="field" name="examLimitMonthly" type="number" placeholder="Unlimited exams" defaultValue={plan.examLimitMonthly ?? ""} />
            <input className="field" name="aiInsightLimitMonthly" type="number" placeholder="Unlimited AI insights" defaultValue={plan.aiInsightLimitMonthly ?? ""} />
            <input className="field" name="dailySubjectLimit" type="number" placeholder="Daily subject limit" defaultValue={plan.dailySubjectLimit ?? ""} />
            <input className="field" name="questionsPerExam" type="number" min={1} max={80} defaultValue={plan.questionsPerExam} />
            <input className="field" name="durationMinutes" type="number" min={1} max={100} defaultValue={plan.durationMinutes} />
            <input className="field" name="customExamMaxQuestions" type="number" min={0} max={80} defaultValue={plan.customExamMaxQuestions} />
            <input className="field" name="customExamMaxMinutes" type="number" min={0} max={100} defaultValue={plan.customExamMaxMinutes} />
            <input className="field" name="llmCustomExamsPerDay" type="number" min={0} max={10} defaultValue={plan.llmCustomExamsPerDay} />
          </div>
          <div className="mt-4 grid gap-2 text-sm font-bold">
            {[
              ["allowAllSubjectsDaily", "All subjects allowed daily", plan.allowAllSubjectsDaily],
              ["allowRepeatSubjectSameDay", "Repeat same subject in one day", plan.allowRepeatSubjectSameDay],
              ["customExamEnabled", "Parent custom LLM exam", plan.customExamEnabled],
              ["shareExamEnabled", "Share generated exams", plan.shareExamEnabled]
            ].map(([name, label, enabled]) => (
              <label key={name as string} className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
                <span>{label as string}</span>
                <input name={name as string} type="checkbox" defaultChecked={Boolean(enabled)} />
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(plan.features).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between rounded-md bg-paper px-3 py-2 text-sm font-bold">
                <span>{featureLabels[key] ?? key}</span>
                <input name={key} type="checkbox" defaultChecked={enabled} />
              </label>
            ))}
          </div>
          <Button className="mt-4 w-full"><ToggleLeft size={16} /> Save package</Button>
        </form>
      ))}
    </div>
  );
}

function QuestionsPanel({
  initial,
  mutate
}: {
  initial?: {
    stats: QuestionBankStats;
    schedule: QuestionGenerationSchedule;
    jobs: QuestionGenerationJob[];
  };
  mutate: (url: string, options: RequestInit, success: string) => Promise<void>;
}) {
  const fallback: QuestionGenerationSchedule = {
    enabled: false,
    subject: "MATHS",
    difficulty: "MEDIUM",
    questionType: "MULTIPLE_CHOICE",
    count: 10,
    microTopic: "Mixed 11+ Practice",
    provider: "GEMINI",
    frequency: "DAILY",
    runAt: "02:00",
    updatedAt: new Date().toISOString()
  };
  const stats = initial?.stats;
  const schedule = initial?.schedule ?? fallback;
  const jobs = initial?.jobs ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <form
          className="premium-card p-4"
          action={(formData) => {
            const payload = {
              subject: String(formData.get("subject")),
              difficulty: String(formData.get("difficulty")),
              questionType: String(formData.get("questionType")),
              count: Number(formData.get("count")),
              microTopic: String(formData.get("microTopic")),
              topic: String(formData.get("topic") || "") || undefined,
              subTopics: String(formData.get("subTopics") || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              provider: String(formData.get("provider"))
            };
            void mutate("/api/admin/questions/generate", { method: "POST", body: JSON.stringify(payload) }, "LLM question generation completed");
          }}
        >
          <div className="flex items-center gap-2">
            <Wand2 className="text-teal" size={22} />
            <h2 className="text-xl font-black">Load questions on demand</h2>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">
            Generate new question-bank items using the selected LLM provider. If no API key is configured, the local fallback still creates testable 11+ questions.
          </p>
          <div className="mt-4 grid gap-3">
            <select className="field" name="subject" defaultValue="MATHS">
              <option value="MATHS">Maths</option>
              <option value="ENGLISH">English</option>
              <option value="VERBAL_REASONING">Verbal Reasoning</option>
              <option value="NON_VERBAL_REASONING">Non-Verbal Reasoning</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className="field" name="difficulty" defaultValue="MEDIUM">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <select className="field" name="questionType" defaultValue="MULTIPLE_CHOICE">
                <option value="MULTIPLE_CHOICE">Multiple choice</option>
                <option value="SHORT_ANSWER">Short answer</option>
              </select>
            </div>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input className="field" name="microTopic" defaultValue="Fractions and reasoning" />
              <input className="field" name="count" type="number" min={1} max={100} defaultValue={10} />
            </div>
            <input className="field" name="topic" placeholder="Optional topic group, e.g. Fractions, Decimals & Percentages" />
            <input className="field" name="subTopics" placeholder="Optional sub-topics in proportion, comma separated" />
            <select className="field" name="provider" defaultValue="GEMINI">
              <option value="GEMINI">Gemini</option>
              <option value="GROQ">Groq</option>
              <option value="INTERNAL">Internal fallback</option>
            </select>
            <Button className="w-full"><Wand2 size={16} /> Generate now</Button>
          </div>
        </form>

        <form
          className="premium-card p-4"
          action={(formData) => {
            const payload = {
              enabled: formData.get("enabled") === "on",
              subject: String(formData.get("subject")),
              difficulty: String(formData.get("difficulty")),
              questionType: String(formData.get("questionType")),
              count: Number(formData.get("count")),
              microTopic: String(formData.get("microTopic")),
              topic: String(formData.get("topic") || "") || undefined,
              subTopics: String(formData.get("subTopics") || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              provider: String(formData.get("provider")),
              frequency: String(formData.get("frequency")),
              runAt: String(formData.get("runAt"))
            };
            void mutate("/api/admin/questions/schedule", { method: "PATCH", body: JSON.stringify(payload) }, "Question generation schedule saved");
          }}
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="text-gold" size={22} />
            <h2 className="text-xl font-black">Scheduled generation job</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center justify-between rounded-md bg-paper px-3 py-2 text-sm font-black">
              Enable scheduled job
              <input name="enabled" type="checkbox" defaultChecked={schedule.enabled} />
            </label>
            <select className="field" name="frequency" defaultValue={schedule.frequency}>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
            <input className="field" name="runAt" type="time" defaultValue={schedule.runAt} />
            <select className="field" name="subject" defaultValue={schedule.subject}>
              <option value="MATHS">Maths</option>
              <option value="ENGLISH">English</option>
              <option value="VERBAL_REASONING">Verbal Reasoning</option>
              <option value="NON_VERBAL_REASONING">Non-Verbal Reasoning</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className="field" name="difficulty" defaultValue={schedule.difficulty}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <select className="field" name="questionType" defaultValue={schedule.questionType}>
                <option value="MULTIPLE_CHOICE">Multiple choice</option>
                <option value="SHORT_ANSWER">Short answer</option>
              </select>
            </div>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input className="field" name="microTopic" defaultValue={schedule.microTopic} />
              <input className="field" name="count" type="number" min={1} max={100} defaultValue={schedule.count} />
            </div>
            <input className="field" name="topic" placeholder="Optional topic group" defaultValue={schedule.topic ?? ""} />
            <input className="field" name="subTopics" placeholder="Optional sub-topics, comma separated" defaultValue={(schedule.subTopics ?? []).join(", ")} />
            <select className="field" name="provider" defaultValue={schedule.provider}>
              <option value="GEMINI">Gemini</option>
              <option value="GROQ">Groq</option>
              <option value="INTERNAL">Internal fallback</option>
            </select>
            <Button className="w-full"><Save size={16} /> Save schedule</Button>
          </div>
        </form>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-black text-white"
          onClick={() => void mutate("/api/admin/questions/schedule", { method: "POST" }, "Scheduled question generation ran now")}
        >
          <CalendarClock size={16} /> Run scheduled job now
        </button>
      </div>

      <div className="space-y-4">
        <div className="premium-card p-4">
          <h2 className="text-xl font-black">Question bank status</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-paper p-3">
              <p className="text-2xl font-black">{stats?.total ?? 0}</p>
              <p className="text-sm font-bold text-ink/55">Total questions</p>
            </div>
            <div className="rounded-md bg-paper p-3">
              <p className="text-2xl font-black">{stats?.llmGenerated ?? 0}</p>
              <p className="text-sm font-bold text-ink/55">LLM generated</p>
            </div>
            <div className="rounded-md bg-paper p-3">
              <p className="text-2xl font-black">{schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "-"}</p>
              <p className="text-sm font-bold text-ink/55">Next scheduled run</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(stats?.bySubject ?? {}).map(([subject, count]) => (
              <div key={subject} className="flex justify-between rounded-md border border-ink/10 bg-white p-3 text-sm font-black">
                <span>{subject.replaceAll("_", " ")}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card p-4">
          <h2 className="text-xl font-black">Generation jobs</h2>
          <div className="mt-3 space-y-2">
            {jobs.length === 0 && <p className="text-sm font-semibold text-ink/55">No generation jobs yet.</p>}
            {jobs.map((job) => (
              <div key={job.id} className="rounded-md border border-ink/10 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black">{job.subject.replaceAll("_", " ")} / {job.microTopic}</p>
                  <span className="chip">{job.status}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink/60">
                  {job.generatedCount}/{job.count} generated via {job.provider} ({job.mode}) at {new Date(job.createdAt).toLocaleString()}
                </p>
                {job.error && <p className="mt-2 text-sm font-bold text-coral">{job.error}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsPanel({ analytics }: { analytics: PlatformAnalytics }) {
  const rows = [
    ["Students", analytics.students],
    ["Parents", analytics.parents],
    ["Admins", analytics.admins],
    ["Exams started", analytics.examsStarted],
    ["Audit events", analytics.auditEvents],
    ["AI insights cached", analytics.aiInsightsCached],
    ["Question bank size", analytics.questionBankSize]
  ];
  return (
    <div className="premium-card p-5">
      <h2 className="text-xl font-black">Reports and platform analytics</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label as string} className="rounded-md border border-ink/10 bg-white p-4">
            <Database className="text-teal" size={20} />
            <p className="mt-3 text-2xl font-black">{value}</p>
            <p className="text-sm font-bold text-ink/55">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-md border border-teal/20 bg-teal/10 p-4">
        <div className="flex items-center gap-2 font-black text-teal"><Shield size={18} /> Current platform status</div>
        <p className="mt-2 text-sm font-semibold text-ink/65">
          API routes, demo repository, AI fallback, question bank, and dashboard rendering are operational in this environment.
        </p>
      </div>
    </div>
  );
}

function PagesPanel({ pages, mutate }: { pages: PublicPage[]; mutate: (url: string, options: RequestInit, success: string) => Promise<void> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {pages.map((page) => (
          <form
            key={page.id}
            className="premium-card p-4"
            action={(formData) => {
              const payload = {
                slug: String(formData.get("slug")),
                title: String(formData.get("title")),
                body: String(formData.get("body")),
                status: String(formData.get("status"))
              };
              void mutate(`/api/admin/pages/${page.id}`, { method: "PATCH", body: JSON.stringify(payload) }, "Public page saved");
            }}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input className="field" name="title" defaultValue={page.title} />
              <select className="field" name="status" defaultValue={page.status}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <input className="field mt-3" name="slug" defaultValue={page.slug} />
            <textarea className="field mt-3 min-h-28" name="body" defaultValue={page.body} />
            <div className="mt-3 flex gap-2">
              <Button><Save size={16} /> Save page</Button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-coral/30 px-3 text-sm font-black text-coral"
                onClick={() => void mutate(`/api/admin/pages/${page.id}`, { method: "DELETE" }, "Public page deleted")}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </form>
        ))}
      </div>
      <form
        className="premium-card p-4"
        action={(formData) => {
          const payload = {
            slug: String(formData.get("slug")),
            title: String(formData.get("title")),
            body: String(formData.get("body")),
            status: String(formData.get("status"))
          };
          void mutate("/api/admin/pages", { method: "POST", body: JSON.stringify(payload) }, "Public page created");
        }}
      >
        <h2 className="text-xl font-black">Create public page</h2>
        <div className="mt-4 space-y-3">
          <input className="field" name="title" placeholder="Page title" required />
          <input className="field" name="slug" placeholder="privacy-policy" required />
          <select className="field" name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <textarea className="field min-h-36" name="body" placeholder="Page content" required />
          <Button className="w-full"><FileText size={16} /> Create page</Button>
        </div>
      </form>
    </div>
  );
}
