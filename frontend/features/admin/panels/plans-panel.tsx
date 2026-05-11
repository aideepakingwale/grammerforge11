"use client";

import { useState } from "react";
import { ToggleLeft } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type { SubscriptionPlanConfig } from "@/backend/shared/types";

type Mutate = (url: string, options: RequestInit, success: string) => Promise<void>;

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

const tierOrder = ["FOUNDATION", "ALPHA", "VELOCITY", "APEX"];

export function PlansPanel({ plans, mutate }: { plans: SubscriptionPlanConfig[]; mutate: Mutate }) {
  const orderedPlans = tierOrder.map((tier) => plans.find((plan) => plan.tier === tier)).filter(Boolean) as SubscriptionPlanConfig[];
  const [drafts, setDrafts] = useState<Record<string, SubscriptionPlanConfig>>(() =>
    Object.fromEntries(orderedPlans.map((plan) => [plan.tier, { ...plan, features: { ...plan.features } }]))
  );

  function updatePlanDraft(tier: string, key: keyof SubscriptionPlanConfig, value: string | number | boolean | null) {
    setDrafts((current) => ({ ...current, [tier]: { ...current[tier], [key]: value } }));
  }

  function updateFeatureDraft(tier: string, key: string, enabled: boolean) {
    setDrafts((current) => ({
      ...current,
      [tier]: { ...current[tier], features: { ...current[tier].features, [key]: enabled } }
    }));
  }

  async function saveTier(tier: string) {
    await mutate(`/api/admin/plans/${tier}`, { method: "PATCH", body: JSON.stringify(drafts[tier]) }, `${tier} plan updated`);
  }

  const numericRows: Array<[keyof SubscriptionPlanConfig, string, string, number, number?]> = [
    ["monthlyPricePence", "Monthly price (pence)", "Billing price for this package.", 0],
    ["examLimitMonthly", "Monthly exam limit", "Blank means unlimited exams.", 0],
    ["aiInsightLimitMonthly", "Monthly AI insight limit", "Blank means unlimited insight reports.", 0],
    ["dailySubjectLimit", "Daily subject allowance", "Blank means unlimited subjects per day.", 0],
    ["questionsPerExam", "Standard questions per exam", "Default question count for standard papers.", 1, 80],
    ["durationMinutes", "Standard duration", "Default timed paper duration.", 1, 100],
    ["customExamMaxQuestions", "Custom max questions", "Maximum questions for parent recipe exams.", 0, 80],
    ["customExamMaxMinutes", "Custom max minutes", "Maximum duration for custom exams.", 0, 100],
    ["llmCustomExamsPerDay", "LLM custom exams per day", "Daily parent-created LLM recipe exams.", 0, 10]
  ];

  const booleanRows: Array<[keyof SubscriptionPlanConfig, string, string]> = [
    ["isActive", "Plan active", "Can be assigned and used."],
    ["allowAllSubjectsDaily", "Allow all subjects daily", "Allows all 11+ subjects in one day."],
    ["allowRepeatSubjectSameDay", "Repeat same subject daily", "Allows the same subject more than once daily."],
    ["customExamEnabled", "Parent custom LLM exam", "Enables the custom recipe builder."],
    ["shareExamEnabled", "Share generated exams", "Allows eligible exam sharing."]
  ];

  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-ink/10 p-4">
        <h2 className="text-xl font-black">Subscription package matrix</h2>
        <p className="mt-1 text-sm font-semibold text-ink/55">Compare and edit Foundation, Alpha, Velocity, and Apex side by side.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="table-header">
              <th className="sticky left-0 z-10 w-[300px] bg-[#f8fafc] px-4 py-3">Configuration field</th>
              {orderedPlans.map((plan) => (
                <th key={plan.tier} className="px-3 py-3">
                  <input className="field bg-white text-ink" value={drafts[plan.tier]?.name ?? plan.name} onChange={(event) => updatePlanDraft(plan.tier, "name", event.target.value)} />
                  <p className="mt-2 text-xs font-black uppercase text-ink/45">{plan.tier}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numericRows.map(([key, label, help, min, max]) => (
              <tr key={key as string}>
                <th className="sticky left-0 z-10 border-b border-ink/10 bg-white px-4 py-3 align-top">
                  <p className="font-black">{label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">{help}</p>
                </th>
                {orderedPlans.map((plan) => (
                  <td key={`${plan.tier}-${key as string}`} className="border-b border-ink/10 px-3 py-3 align-top">
                    <input className="field" type="number" min={min} max={max} value={(drafts[plan.tier]?.[key] as number | null) ?? ""} placeholder="Unlimited" onChange={(event) => updatePlanDraft(plan.tier, key, event.target.value === "" ? null : Number(event.target.value))} />
                  </td>
                ))}
              </tr>
            ))}
            {booleanRows.map(([key, label, help]) => (
              <tr key={key as string}>
                <th className="sticky left-0 z-10 border-b border-ink/10 bg-white px-4 py-3 align-top">
                  <p className="font-black">{label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">{help}</p>
                </th>
                {orderedPlans.map((plan) => (
                  <td key={`${plan.tier}-${key as string}`} className="border-b border-ink/10 px-3 py-3 text-center">
                    <input className="h-5 w-5 accent-teal" type="checkbox" checked={Boolean(drafts[plan.tier]?.[key])} onChange={(event) => updatePlanDraft(plan.tier, key, event.target.checked)} />
                  </td>
                ))}
              </tr>
            ))}
            {Object.keys(orderedPlans[0]?.features ?? {}).map((feature) => (
              <tr key={feature}>
                <th className="sticky left-0 z-10 border-b border-ink/10 bg-white px-4 py-3 align-top">
                  <p className="font-black">{featureLabels[feature] ?? feature}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">App feature gate.</p>
                </th>
                {orderedPlans.map((plan) => (
                  <td key={`${plan.tier}-${feature}`} className="border-b border-ink/10 px-3 py-3 text-center">
                    <input className="h-5 w-5 accent-teal" type="checkbox" checked={Boolean(drafts[plan.tier]?.features?.[feature as keyof SubscriptionPlanConfig["features"]])} onChange={(event) => updateFeatureDraft(plan.tier, feature, event.target.checked)} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 bg-white px-4 py-4">Save package</th>
              {orderedPlans.map((plan) => (
                <td key={`${plan.tier}-save`} className="px-3 py-4">
                  <Button className="w-full" type="button" onClick={() => void saveTier(plan.tier)}><ToggleLeft size={16} /> Save {plan.name}</Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
