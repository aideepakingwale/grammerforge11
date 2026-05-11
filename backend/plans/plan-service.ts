import type { Subject, SubscriptionPlanConfig, Tier } from "@/backend/shared/types";
import { store } from "@/backend/exams/demo-store";

export function listPlans() {
  return store().plans;
}

export function planHasFeature(tier: Tier, feature: keyof SubscriptionPlanConfig["features"]) {
  const plan = store().plans.find((candidate) => candidate.tier === tier);
  return Boolean(plan?.isActive && plan.features[feature]);
}

export function updatePlan(tier: Tier, input: Partial<SubscriptionPlanConfig>) {
  const plan = store().plans.find((candidate) => candidate.tier === tier);
  if (!plan) throw new Error("Plan not found.");
  Object.assign(plan, input, {
    features: input.features ? { ...plan.features, ...input.features } : plan.features,
    updatedAt: new Date().toISOString()
  });
  return plan;
}

export function getPlanForTier(tier: Tier) {
  const plan = store().plans.find((candidate) => candidate.tier === tier);
  if (!plan?.isActive) throw new Error("This subscription plan is not active.");
  return plan;
}

function dayKey(value?: string) {
  return (value ? new Date(value) : new Date()).toISOString().slice(0, 10);
}

export function validateExamAccess(input: {
  studentId: string;
  subject: Subject;
  tier: Tier;
  isCustomLlm?: boolean;
}) {
  const plan = getPlanForTier(input.tier);
  const today = dayKey();
  const todaysExams = store().exams.filter((exam) => exam.studentId === input.studentId && dayKey(exam.startedAt) === today);
  const todaysStandard = todaysExams.filter((exam) => !exam.id.includes("_custom_"));
  const todaysCustom = todaysExams.filter((exam) => exam.id.includes("_custom_"));

  if (input.isCustomLlm) {
    if (!plan.customExamEnabled) throw new Error(`${plan.name} does not include custom LLM exam generation.`);
    if (todaysCustom.length >= plan.llmCustomExamsPerDay) {
      throw new Error(`${plan.name} allows ${plan.llmCustomExamsPerDay} custom LLM exam per day.`);
    }
    return plan;
  }

  if (!plan.allowRepeatSubjectSameDay && todaysStandard.some((exam) => exam.subject === input.subject)) {
    throw new Error(`${plan.name} allows ${input.subject.replaceAll("_", " ")} only once per day.`);
  }
  if (!plan.allowAllSubjectsDaily && todaysStandard.length >= (plan.dailySubjectLimit ?? 1)) {
    throw new Error(`${plan.name} allows one subject per day. Please come back tomorrow for the next subject.`);
  }
  if (plan.allowAllSubjectsDaily && plan.dailySubjectLimit && new Set(todaysStandard.map((exam) => exam.subject)).size >= plan.dailySubjectLimit) {
    throw new Error(`${plan.name} daily subject allowance has been used.`);
  }

  return plan;
}
