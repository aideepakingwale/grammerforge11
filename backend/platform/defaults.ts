import type { PlatformConfig, PublicPage, QuestionGenerationSchedule, SubscriptionPlanConfig } from "@/backend/shared/types";

function mask(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

export function defaultPlatformConfig(): PlatformConfig {
  return {
    activeLlmProvider: "GEMINI",
    geminiEnabled: true,
    groqEnabled: true,
    redisCacheEnabled: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    aiDailyLimitFree: 3,
    aiDailyLimitPro: 25,
    aiDailyLimitPremium: 100,
    maskedGeminiKey: mask(process.env.GEMINI_API_KEY, "not configured"),
    maskedGroqKey: mask(process.env.GROQ_API_KEY, "not configured"),
    maskedStripeKey: mask(process.env.STRIPE_SECRET_KEY, "not configured"),
    llmQuota: [],
    updatedAt: new Date().toISOString()
  };
}

const defaultFeatures: SubscriptionPlanConfig["features"] = {
  STANDARD_EXAMS: true,
  AI_SHORT_ANSWER_EVALUATION: false,
  STEP_BY_STEP_EXPLANATIONS: false,
  BASIC_ANALYTICS: true,
  DEEP_AI_STUDY_PLAN: false,
  SECURE_PROCTORING: false,
  UNLIMITED_TARGETED_EXAMS: false,
  PREDICTIVE_PASS_SCORE: false,
  EXTERNAL_AI_PROMPT_HELP: false
};

export function defaultPlans(): SubscriptionPlanConfig[] {
  const now = new Date().toISOString();
  return [
    {
      tier: "FOUNDATION",
      name: "Foundation",
      positioning: "The Starting Line",
      monthlyPricePence: 499,
      examLimitMonthly: 30,
      aiInsightLimitMonthly: 2,
      dailySubjectLimit: 1,
      questionsPerExam: 10,
      durationMinutes: 10,
      allowAllSubjectsDaily: false,
      allowRepeatSubjectSameDay: false,
      customExamEnabled: false,
      customExamMaxQuestions: 0,
      customExamMaxMinutes: 0,
      llmCustomExamsPerDay: 0,
      shareExamEnabled: false,
      features: { ...defaultFeatures },
      isActive: true,
      updatedAt: now
    },
    {
      tier: "ALPHA",
      name: "Alpha",
      positioning: "The Status Tier",
      monthlyPricePence: 999,
      examLimitMonthly: 25,
      aiInsightLimitMonthly: 20,
      dailySubjectLimit: 1,
      questionsPerExam: 50,
      durationMinutes: 50,
      allowAllSubjectsDaily: false,
      allowRepeatSubjectSameDay: false,
      customExamEnabled: false,
      customExamMaxQuestions: 0,
      customExamMaxMinutes: 0,
      llmCustomExamsPerDay: 0,
      shareExamEnabled: false,
      features: {
        ...defaultFeatures,
        AI_SHORT_ANSWER_EVALUATION: true,
        STEP_BY_STEP_EXPLANATIONS: true,
        EXTERNAL_AI_PROMPT_HELP: true
      },
      isActive: true,
      updatedAt: now
    },
    {
      tier: "VELOCITY",
      name: "Velocity",
      positioning: "The Results Tier",
      monthlyPricePence: 1999,
      examLimitMonthly: null,
      aiInsightLimitMonthly: null,
      dailySubjectLimit: 4,
      questionsPerExam: 50,
      durationMinutes: 50,
      allowAllSubjectsDaily: true,
      allowRepeatSubjectSameDay: false,
      customExamEnabled: false,
      customExamMaxQuestions: 0,
      customExamMaxMinutes: 0,
      llmCustomExamsPerDay: 0,
      shareExamEnabled: true,
      features: {
        STANDARD_EXAMS: true,
        AI_SHORT_ANSWER_EVALUATION: true,
        STEP_BY_STEP_EXPLANATIONS: true,
        BASIC_ANALYTICS: true,
        DEEP_AI_STUDY_PLAN: true,
        SECURE_PROCTORING: true,
        UNLIMITED_TARGETED_EXAMS: false,
        PREDICTIVE_PASS_SCORE: true,
        EXTERNAL_AI_PROMPT_HELP: true
      },
      isActive: true,
      updatedAt: now
    },
    {
      tier: "APEX",
      name: "Apex",
      positioning: "The Luxury Tier",
      monthlyPricePence: 2999,
      examLimitMonthly: null,
      aiInsightLimitMonthly: null,
      dailySubjectLimit: null,
      questionsPerExam: 80,
      durationMinutes: 60,
      allowAllSubjectsDaily: true,
      allowRepeatSubjectSameDay: true,
      customExamEnabled: true,
      customExamMaxQuestions: 80,
      customExamMaxMinutes: 100,
      llmCustomExamsPerDay: 1,
      shareExamEnabled: true,
      features: {
        STANDARD_EXAMS: true,
        AI_SHORT_ANSWER_EVALUATION: true,
        STEP_BY_STEP_EXPLANATIONS: true,
        BASIC_ANALYTICS: true,
        DEEP_AI_STUDY_PLAN: true,
        SECURE_PROCTORING: true,
        UNLIMITED_TARGETED_EXAMS: true,
        PREDICTIVE_PASS_SCORE: true,
        EXTERNAL_AI_PROMPT_HELP: true
      },
      isActive: true,
      updatedAt: now
    }
  ];
}

export function defaultPublicPages(): PublicPage[] {
  const now = new Date().toISOString();
  return [
    {
      id: "page_privacy",
      slug: "privacy",
      title: "Privacy Statement",
      body: "GrammarForge protects learner data, minimises AI prompt data, and supports UK GDPR-aligned operating practices.",
      status: "PUBLISHED",
      updatedAt: now
    },
    {
      id: "page_terms",
      slug: "terms",
      title: "Terms and Conditions",
      body: "Use of this platform requires responsible supervision, original study use, and acceptance of subscription terms.",
      status: "DRAFT",
      updatedAt: now
    },
    {
      id: "page_about",
      slug: "about",
      title: "About GrammarForge",
      body: "GrammarForge is an 11+ preparation platform created to help children practise with confidence and parents act on clear insight.",
      status: "PUBLISHED",
      updatedAt: now
    }
  ];
}

export function nextScheduleRun(frequency: "DAILY" | "WEEKLY", runAt: string) {
  const [hours, minutes] = runAt.split(":").map(Number);
  const next = new Date();
  next.setHours(Number.isFinite(hours) ? hours : 2, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + (frequency === "DAILY" ? 1 : 7));
  return next.toISOString();
}

export function defaultQuestionGenerationSchedule(): QuestionGenerationSchedule {
  return {
    enabled: false,
    subject: "MATHS",
    difficulty: "MEDIUM",
    questionType: "MULTIPLE_CHOICE",
    count: 10,
    microTopic: "Mixed 11+ Practice",
    provider: "GEMINI",
    frequency: "DAILY",
    runAt: "02:00",
    nextRunAt: nextScheduleRun("DAILY", "02:00"),
    updatedAt: new Date().toISOString()
  };
}
