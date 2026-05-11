import bcrypt from "bcryptjs";
import { questionBank } from "@/backend/questions/question-bank";
import { examPatternFor } from "@/backend/exams/exam-patterns";
import type {
  AdminUserInput,
  AuditEvent,
  Exam,
  Insight,
  PlatformAnalytics,
  PlatformConfig,
  PublicPage,
  QuestionBankStats,
  Role,
  SafeUser,
  Subject,
  SubscriptionPlanConfig,
  Tier,
  Difficulty,
  LlmProvider,
  Question,
  QuestionGenerationJob,
  QuestionGenerationSchedule,
  QuestionType
} from "@/backend/shared/types";
import { normaliseAnswer, uid } from "@/backend/shared/utils";
import { enrichQuestionSyllabus, syllabusRegistry, topicForSubTopic } from "@/backend/syllabus/registry";

type StoredUser = SafeUser & { passwordHash: string };

type Store = {
  users: StoredUser[];
  exams: Exam[];
  auditLogs: AuditEvent[];
  insights: Insight[];
  platformConfig: PlatformConfig;
  plans: SubscriptionPlanConfig[];
  publicPages: PublicPage[];
  questionGenerationJobs: QuestionGenerationJob[];
  questionGenerationSchedule: QuestionGenerationSchedule;
};

declare global {
  var grammarForgeStore: Store | undefined;
}

const parentId = "user_parent_demo";
const studentId = "user_student_demo";
const adminId = "user_admin_demo";

function mask(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function defaultPlatformConfig(): PlatformConfig {
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

function defaultPlans(): SubscriptionPlanConfig[] {
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

function defaultPublicPages(): PublicPage[] {
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

function defaultQuestionGenerationSchedule(): QuestionGenerationSchedule {
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

function nextScheduleRun(frequency: "DAILY" | "WEEKLY", runAt: string) {
  const [hours, minutes] = runAt.split(":").map(Number);
  const next = new Date();
  next.setHours(Number.isFinite(hours) ? hours : 2, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + (frequency === "DAILY" ? 1 : 7));
  return next.toISOString();
}

function seedStore(): Store {
  const passwordHash = bcrypt.hashSync("Password123!", 10);
  return {
    users: [
      {
        id: parentId,
        role: "PARENT",
        subscriptionTier: "APEX",
        email: "parent@example.com",
        passwordHash,
        firstName: "Deepak",
        lastName: "Ingwale",
        stripeCustomerId: "cus_demo_parent"
      },
      {
        id: adminId,
        role: "ADMIN",
        subscriptionTier: "APEX",
        email: "admin@example.com",
        passwordHash,
        firstName: "Deepak",
        lastName: "Ingwale",
        stripeCustomerId: "cus_demo_admin"
      },
      {
        id: studentId,
        role: "STUDENT",
        subscriptionTier: "APEX",
        email: "student@example.com",
        passwordHash,
        firstName: "Devansh",
        lastName: "Ingwale",
        parentId
      }
    ],
    exams: [],
    auditLogs: [],
    insights: [],
    platformConfig: defaultPlatformConfig(),
    plans: defaultPlans(),
    publicPages: defaultPublicPages(),
    questionGenerationJobs: [],
    questionGenerationSchedule: defaultQuestionGenerationSchedule()
  };
}

export function store() {
  globalThis.grammarForgeStore ??= seedStore();
  const passwordHash = bcrypt.hashSync("Password123!", 10);
  const demoStudent = globalThis.grammarForgeStore.users.find((user) => user.id === studentId);
  if (demoStudent) {
    demoStudent.firstName = "Devansh";
    demoStudent.lastName = "Ingwale";
  }
  const demoParent = globalThis.grammarForgeStore.users.find((user) => user.id === parentId);
  if (demoParent) {
    demoParent.firstName = "Deepak";
    demoParent.lastName = "Ingwale";
  }
  const demoAdmin = globalThis.grammarForgeStore.users.find((user) => user.id === adminId || user.email === "admin@example.com");
  if (demoAdmin) {
    demoAdmin.id = adminId;
    demoAdmin.role = "ADMIN";
    demoAdmin.subscriptionTier = "APEX";
    demoAdmin.email = "admin@example.com";
    demoAdmin.firstName = "Deepak";
    demoAdmin.lastName = "Ingwale";
  } else {
    globalThis.grammarForgeStore.users.push({
      id: adminId,
      role: "ADMIN",
      subscriptionTier: "APEX",
      email: "admin@example.com",
      passwordHash,
      firstName: "Deepak",
      lastName: "Ingwale",
      stripeCustomerId: "cus_demo_admin"
    });
  }
  globalThis.grammarForgeStore.platformConfig ??= defaultPlatformConfig();
  if (!globalThis.grammarForgeStore.plans?.length) {
    globalThis.grammarForgeStore.plans = defaultPlans();
  }
  const validTiers: Tier[] = ["FOUNDATION", "ALPHA", "VELOCITY", "APEX"];
  if (
    globalThis.grammarForgeStore.plans.length !== 4 ||
    globalThis.grammarForgeStore.plans.some((plan) => !validTiers.includes(plan.tier))
  ) {
    globalThis.grammarForgeStore.plans = defaultPlans();
  }
  const freshPlans = defaultPlans();
  globalThis.grammarForgeStore.plans = globalThis.grammarForgeStore.plans.map((plan) => {
    const fresh = freshPlans.find((item) => item.tier === plan.tier);
    return fresh
      ? {
          ...fresh,
          ...plan,
          features: {
            ...fresh.features,
            ...plan.features
          }
        }
      : plan;
  });
  for (const user of globalThis.grammarForgeStore.users) {
    if (!validTiers.includes(user.subscriptionTier)) user.subscriptionTier = "FOUNDATION";
  }
  if (!globalThis.grammarForgeStore.publicPages?.length) {
    globalThis.grammarForgeStore.publicPages = defaultPublicPages();
  }
  globalThis.grammarForgeStore.questionGenerationJobs ??= [];
  globalThis.grammarForgeStore.questionGenerationSchedule ??= defaultQuestionGenerationSchedule();
  return globalThis.grammarForgeStore;
}

export function toSafeUser(user: StoredUser): SafeUser {
  return {
    id: user.id,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    parentId: user.parentId,
    stripeCustomerId: user.stripeCustomerId
  };
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  parentId?: string;
}) {
  const data = store();
  const existing = data.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new Error("An account with this email already exists.");

  const user: StoredUser = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 10),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    parentId: input.role === "STUDENT" ? input.parentId ?? parentId : null,
    subscriptionTier: "FOUNDATION"
  };
  data.users.push(user);
  return toSafeUser(user);
}

export async function adminCreateUser(input: AdminUserInput) {
  const data = store();
  const existing = data.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new Error("An account with this email already exists.");

  const user: StoredUser = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password || "Password123!", 10),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    parentId: input.role === "STUDENT" ? input.parentId ?? parentId : null,
    subscriptionTier: input.subscriptionTier
  };
  data.users.push(user);
  return toSafeUser(user);
}

export function adminListUsers() {
  return store().users.map(toSafeUser);
}

export function adminUpdateUser(userId: string, input: Partial<AdminUserInput>) {
  const user = store().users.find((candidate) => candidate.id === userId);
  if (!user) throw new Error("User not found.");
  if (input.email) user.email = input.email.toLowerCase();
  if (input.firstName) user.firstName = input.firstName;
  if (input.lastName) user.lastName = input.lastName;
  if (input.role) user.role = input.role;
  if (input.subscriptionTier) user.subscriptionTier = input.subscriptionTier;
  if ("parentId" in input) user.parentId = input.parentId;
  return toSafeUser(user);
}

export function adminDeleteUser(userId: string) {
  if (userId === adminId) throw new Error("The primary superadmin demo account cannot be deleted.");
  const data = store();
  const before = data.users.length;
  data.users = data.users.filter((user) => user.id !== userId);
  data.exams = data.exams.filter((exam) => exam.studentId !== userId);
  if (data.users.length === before) throw new Error("User not found.");
  return { ok: true };
}

export function getPlatformConfig() {
  return store().platformConfig;
}

export function updatePlatformConfig(input: Partial<PlatformConfig>) {
  const data = store();
  data.platformConfig = {
    ...data.platformConfig,
    ...input,
    maskedGeminiKey: input.maskedGeminiKey ?? data.platformConfig.maskedGeminiKey,
    maskedGroqKey: input.maskedGroqKey ?? data.platformConfig.maskedGroqKey,
    maskedStripeKey: input.maskedStripeKey ?? data.platformConfig.maskedStripeKey,
    updatedAt: new Date().toISOString()
  };
  return data.platformConfig;
}

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

export function listPublicPages() {
  return store().publicPages;
}

export function upsertPublicPage(input: Omit<PublicPage, "id" | "updatedAt"> & { id?: string }) {
  const data = store();
  const existing = data.publicPages.find((page) => page.id === input.id || page.slug === input.slug);
  if (existing) {
    existing.slug = input.slug;
    existing.title = input.title;
    existing.body = input.body;
    existing.status = input.status;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const created: PublicPage = {
    ...input,
    id: uid("page"),
    updatedAt: new Date().toISOString()
  };
  data.publicPages.push(created);
  return created;
}

export function deletePublicPage(pageId: string) {
  const data = store();
  const before = data.publicPages.length;
  data.publicPages = data.publicPages.filter((page) => page.id !== pageId);
  if (data.publicPages.length === before) throw new Error("Page not found.");
  return { ok: true };
}

export function platformAnalytics(): PlatformAnalytics {
  const data = store();
  const completed = data.exams.filter((exam) => exam.status === "GRADED");
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, exam) => sum + (exam.score ?? 0), 0) / completed.length)
    : 0;
  return {
    totalUsers: data.users.length,
    students: data.users.filter((user) => user.role === "STUDENT").length,
    parents: data.users.filter((user) => user.role === "PARENT").length,
    admins: data.users.filter((user) => user.role === "ADMIN").length,
    activeSubscriptions: data.users.filter((user) => user.subscriptionTier !== "FOUNDATION").length,
    examsStarted: data.exams.length,
    examsCompleted: completed.length,
    averageScore,
    auditEvents: data.auditLogs.length,
    aiInsightsCached: data.insights.length,
    questionBankSize: questionBank.length,
    uptimeStatus: "OPERATIONAL"
  };
}

export function questionBankStats(): QuestionBankStats {
  const bySubject = {
    MATHS: 0,
    ENGLISH: 0,
    VERBAL_REASONING: 0,
    NON_VERBAL_REASONING: 0
  };
  const byDifficulty = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    ADVANCED: 0
  };
  for (const question of questionBank) {
    bySubject[question.subjectType] += 1;
    byDifficulty[question.difficultyLevel] += 1;
  }
  return {
    total: questionBank.length,
    bySubject,
    byDifficulty,
    llmGenerated: questionBank.filter((question) => question.id.includes("q_llm") || question.id.includes("q_admin_llm")).length
  };
}

export function questionGenerationAdminState() {
  const data = store();
  return {
    stats: questionBankStats(),
    schedule: data.questionGenerationSchedule,
    jobs: data.questionGenerationJobs.slice().reverse().slice(0, 12)
  };
}

export function updateQuestionGenerationSchedule(input: Partial<QuestionGenerationSchedule>) {
  const data = store();
  const frequency = input.frequency ?? data.questionGenerationSchedule.frequency;
  const runAt = input.runAt ?? data.questionGenerationSchedule.runAt;
  data.questionGenerationSchedule = {
    ...data.questionGenerationSchedule,
    ...input,
    frequency,
    runAt,
    nextRunAt: nextScheduleRun(frequency, runAt),
    updatedAt: new Date().toISOString()
  };
  return data.questionGenerationSchedule;
}

type QuestionGenerationInput = {
  subject: Subject;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  microTopic: string;
  topic?: string;
  subTopics?: string[];
  provider: LlmProvider;
  mode: "ON_DEMAND" | "SCHEDULED";
};

type QuestionGenerationPlanItem = {
  topic: string;
  syllabusTopicSlug: string;
  subTopic: string;
  count: number;
};

export async function runQuestionGeneration(input: QuestionGenerationInput) {
  const data = store();
  const generationPlan = buildQuestionGenerationPlan(input);
  const job: QuestionGenerationJob = {
    id: uid("qgen"),
    subject: input.subject,
    difficulty: input.difficulty,
    questionType: input.questionType,
    count: input.count,
    microTopic: generationPlan.map((item) => item.subTopic).join(", "),
    topic: input.topic,
    subTopics: generationPlan.map((item) => item.subTopic),
    generationPlan,
    provider: input.provider,
    status: "RUNNING",
    mode: input.mode,
    createdAt: new Date().toISOString(),
    generatedCount: 0
  };
  data.questionGenerationJobs.push(job);

  try {
    const generated = await generateAdminQuestions(input, generationPlan);
    questionBank.push(...generated);
    job.status = "COMPLETED";
    job.generatedCount = generated.length;
    job.completedAt = new Date().toISOString();
    addAuditLog("admin_question_generation", "QUESTION_FLAGGED", {
      jobId: job.id,
      subject: input.subject,
      count: generated.length,
      provider: input.provider,
      mode: input.mode
    });
  } catch (error) {
    job.status = "FAILED";
    job.error = error instanceof Error ? error.message : "Question generation failed";
    job.completedAt = new Date().toISOString();
  }

  return { job, stats: questionBankStats() };
}

export async function runScheduledQuestionGenerationNow() {
  const schedule = store().questionGenerationSchedule;
  if (!schedule.enabled) throw new Error("Scheduled question generation is disabled.");
  const result = await runQuestionGeneration({ ...schedule, mode: "SCHEDULED" });
  updateQuestionGenerationSchedule({ nextRunAt: nextScheduleRun(schedule.frequency, schedule.runAt) });
  return result;
}

function buildQuestionGenerationPlan(input: QuestionGenerationInput): QuestionGenerationPlanItem[] {
  const requestedSubTopics = input.subTopics?.map((item) => item.trim()).filter(Boolean) ?? [];
  const topicGroups = syllabusRegistry[input.subject];
  const selectedTopics = input.topic
    ? topicGroups.filter((topic) => topic.name === input.topic || topic.slug === input.topic)
    : topicGroups;
  const pool = (selectedTopics.length ? selectedTopics : topicGroups).flatMap((topic) => {
    const subTopics = requestedSubTopics.length
      ? topic.subTopics.filter((subTopic) => requestedSubTopics.some((requested) => requested.toLowerCase() === subTopic.toLowerCase()))
      : topic.subTopics;
    return (subTopics.length ? subTopics : [input.microTopic]).map((subTopic) => ({
      topic: topic.name,
      syllabusTopicSlug: topic.slug,
      subTopic
    }));
  });
  const normalizedPool = pool.length
    ? pool
    : [{
        topic: topicForSubTopic(input.subject, input.microTopic).name,
        syllabusTopicSlug: topicForSubTopic(input.subject, input.microTopic).slug,
        subTopic: input.microTopic
      }];

  const base = Math.floor(input.count / normalizedPool.length);
  let remainder = input.count % normalizedPool.length;
  return normalizedPool
    .map((item) => {
      const count = base + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return { ...item, count };
    })
    .filter((item) => item.count > 0);
}

async function generateAdminQuestions(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]): Promise<Question[]> {
  const llmQuestions = input.provider === "INTERNAL" ? null : await generateQuestionsWithConfiguredLlm(input, generationPlan);
  if (llmQuestions?.length) return llmQuestions.slice(0, input.count);

  const sourceQuestions = questionBank.filter((question) => question.subjectType === input.subject);
  const fallback = sourceQuestions[0] ?? questionBank[0];
  const planSlots = generationPlan.flatMap((plan) => Array.from({ length: plan.count }, () => plan));
  return Array.from({ length: input.count }, (_, index) => {
    const source = sourceQuestions[index % Math.max(sourceQuestions.length, 1)] ?? fallback;
    const isMultipleChoice = input.questionType === "MULTIPLE_CHOICE";
    const plan = planSlots[index] ?? generationPlan[0];
    return {
      ...enrichQuestionSyllabus(source),
      id: uid("q_admin_llm"),
      subjectType: input.subject,
      questionType: input.questionType,
      difficultyLevel: input.difficulty,
      topic: plan.topic,
      syllabusTopicSlug: plan.syllabusTopicSlug,
      microTopic: plan.subTopic,
      instruction: isMultipleChoice ? "Choose the best answer." : "Write a concise answer.",
      questionData: {
        mode: "text",
        content: `${plan.subTopic}: generated ${input.subject.replaceAll("_", " ").toLowerCase()} practice item ${index + 1}.`
      },
      options: isMultipleChoice
        ? [
            { mode: "text", content: source.answer },
            { mode: "text", content: "Not enough information" },
            { mode: "text", content: "A distractor answer" },
            { mode: "text", content: "Another plausible answer" }
          ]
        : [],
      answer: source.answer,
      explanation: `Generated using the configured question-generation workflow. ${source.explanation}`,
      skillTags: [plan.subTopic.toLowerCase(), plan.topic.toLowerCase(), "llm-generated", input.provider.toLowerCase()],
      examBoardTags: topicForSubTopic(input.subject, plan.subTopic).examBoards,
      marksAvailable: source.marksAvailable ?? 1,
      scoringWeight: source.scoringWeight ?? 1,
      estimatedSeconds: input.difficulty === "EASY" ? 45 : input.difficulty === "MEDIUM" ? 60 : 75
    };
  });
}

function buildLlmQuestionPrompt(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  return [
    "You are generating original UK 11+ practice questions for a production learning platform.",
    "Return only valid JSON. Do not wrap it in markdown.",
    "The JSON shape must be: { \"questions\": [ ... ] }.",
    "Each question object must contain: questionType, difficultyLevel, topic, syllabusTopicSlug, microTopic, instruction, stimulus, questionData, options, answer, explanation, skillTags, estimatedSeconds, marksAvailable, scoringWeight.",
    "Use this content payload shape for questionData, stimulus, and options: { \"mode\": \"text\" | \"svg\" | \"passage\" | \"table\", \"title\"?: string, \"content\": string, \"caption\"?: string }.",
    "For non-verbal reasoning, use clean SVG content for visual stimuli and options.",
    "For English comprehension, include the passage in stimulus and never omit it.",
    "Questions must be age-appropriate, unambiguous, original, and suitable for timed 11+ exam practice.",
    `Subject: ${input.subject}.`,
    `Question type: ${input.questionType}.`,
    `Difficulty: ${input.difficulty}.`,
    `Total count: ${input.count}.`,
    "Generate in this exact proportional plan:",
    ...generationPlan.map((item) => `- ${item.count} question(s): topic=${item.topic}; syllabusTopicSlug=${item.syllabusTopicSlug}; subTopic=${item.subTopic}`)
  ].join("\n");
}

async function generateQuestionsWithConfiguredLlm(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  const prompt = buildLlmQuestionPrompt(input, generationPlan);
  const text = await callQuestionGenerationLlm(input.provider, prompt);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim());
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    return questions.map((question: Partial<Question>) => {
      const topic = question.topic && question.syllabusTopicSlug
        ? { name: question.topic, slug: question.syllabusTopicSlug, examBoards: question.examBoardTags ?? [] }
        : topicForSubTopic(input.subject, question.microTopic ?? input.microTopic);
      return enrichQuestionSyllabus({
        id: uid("q_admin_llm"),
        subjectType: input.subject,
        questionType: input.questionType,
        difficultyLevel: input.difficulty,
        topic: topic.name,
        syllabusTopicSlug: topic.slug,
        microTopic: question.microTopic ?? input.microTopic,
        instruction: question.instruction ?? (input.questionType === "MULTIPLE_CHOICE" ? "Choose the best answer." : "Write a concise answer."),
        stimulus: question.stimulus,
        questionData: question.questionData ?? { mode: "text", content: "Answer this 11+ practice question." },
        options: input.questionType === "MULTIPLE_CHOICE" ? question.options ?? [] : [],
        answer: question.answer ?? "",
        explanation: question.explanation ?? "Review the relevant method and try a similar question.",
        skillTags: question.skillTags ?? [question.microTopic ?? input.microTopic],
        examBoardTags: question.examBoardTags,
        estimatedSeconds: question.estimatedSeconds ?? (input.difficulty === "EASY" ? 45 : input.difficulty === "MEDIUM" ? 60 : 75),
        marksAvailable: question.marksAvailable ?? 1,
        scoringWeight: question.scoringWeight ?? 1
      });
    });
  } catch {
    return null;
  }
}

async function callQuestionGenerationLlm(provider: LlmProvider, prompt: string) {
  if (provider === "GEMINI" && process.env.GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.45, responseMimeType: "application/json" }
        })
      }
    );
    if (response.ok) {
      const json = await response.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    }
  }

  if (provider === "GROQ" && process.env.GROQ_API_KEY) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        response_format: { type: "json_object" }
      })
    });
    if (response.ok) {
      const json = await response.json();
      return json.choices?.[0]?.message?.content as string | undefined;
    }
  }

  return null;
}

export async function verifyUser(email: string, password: string) {
  const user = store().users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? toSafeUser(user) : null;
}

export function findUser(id: string) {
  const user = store().users.find((candidate) => candidate.id === id);
  return user ? toSafeUser(user) : null;
}

export function listStudentsFor(parentUserId: string) {
  return store()
    .users.filter((user) => user.parentId === parentUserId)
    .map(toSafeUser);
}

export async function createExam(input: {
  studentId: string;
  subject: Subject;
  difficulty?: string;
  isProctored: boolean;
  questionCount?: number;
  durationSeconds?: number;
  isCustomLlm?: boolean;
  difficultyMix?: { easy: number; medium: number; hard: number };
  topic?: string;
  subTopics?: string[];
  microTopic?: string;
}) {
  const now = new Date();
  const durationSeconds = input.durationSeconds ?? 3000;
  const requestedCount = input.questionCount ?? 5;
  const pattern = examPatternFor(input.subject);
  const subjectQuestions: Question[] = input.isCustomLlm
    ? await generateCustomQuestions({
        subject: input.subject,
        count: requestedCount,
        difficultyMix: input.difficultyMix,
        topic: input.topic,
        subTopics: input.subTopics,
        microTopic: input.microTopic
      })
    : selectQuestionsByPattern(input.subject, requestedCount);
  const selected = subjectQuestions.map(enrichQuestionSyllabus).slice(0, Math.min(requestedCount, subjectQuestions.length));
  if (selected.length === 0) {
    throw new Error(`No demo questions are available for ${input.subject}.`);
  }
  const totalMarks = selected.reduce((sum, question) => sum + (question.marksAvailable ?? pattern.marksPerQuestion), 0);

  const exam: Exam = {
    id: input.isCustomLlm ? uid("exam_custom") : uid("exam"),
    studentId: input.studentId,
    subject: input.subject,
    patternLabel: pattern.label,
    isProctored: input.isProctored,
    status: "IN_PROGRESS",
    totalQuestions: selected.length,
    correctAnswers: 0,
    rawScore: 0,
    totalMarks,
    passBenchmarkPercent: pattern.passBenchmarkPercent,
    durationSeconds,
    serverStartedAt: now.toISOString(),
    serverExpiresAt: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    startedAt: now.toISOString(),
    questions: selected.map((question, index) => {
      const section = pattern.sections.find((candidate) => candidate.topicSlugs.includes(question.syllabusTopicSlug ?? ""));
      return {
        question,
        sequenceOrder: index + 1,
        points: question.marksAvailable ?? pattern.marksPerQuestion,
        sectionName: section?.name
      };
    }),
    answers: {}
  };

  store().exams.push(exam);
  addAuditLog(exam.id, "EXAM_STARTED", {
    subject: input.subject,
    proctored: input.isProctored,
    requestedCount,
    customLlm: Boolean(input.isCustomLlm)
  });
  return exam;
}

function selectQuestionsByPattern(subject: Subject, requestedCount: number): Question[] {
  const pattern = examPatternFor(subject);
  const pool = questionBank.filter((question) => question.subjectType === subject).map(enrichQuestionSyllabus);
  if (pool.length === 0) return [];

  const selected: Question[] = [];
  for (const section of pattern.sections) {
    const quota = Math.max(1, Math.round((section.questionCount / pattern.totalQuestions) * requestedCount));
    const sectionPool = pool.filter((question) => section.topicSlugs.includes(question.syllabusTopicSlug ?? ""));
    const source = sectionPool.length ? sectionPool : pool;
    for (let index = 0; index < quota && selected.length < requestedCount; index += 1) {
      const question = source[index % source.length];
      selected.push({ ...question, id: `${question.id}_slot_${selected.length + 1}` });
    }
  }
  let index = 0;
  while (selected.length < requestedCount) {
    const question = pool[index % pool.length];
    selected.push({ ...question, id: `${question.id}_slot_${selected.length + 1}` });
    index += 1;
  }
  return selected;
}

async function generateCustomQuestions(input: {
  subject: Subject;
  count: number;
  difficultyMix?: { easy: number; medium: number; hard: number };
  topic?: string;
  subTopics?: string[];
  microTopic?: string;
}): Promise<Question[]> {
  const provider = store().platformConfig.activeLlmProvider;
  const difficultyPlan = normalizeDifficultyMix(input.count, input.difficultyMix);
  const globalGenerationInput: QuestionGenerationInput = {
    subject: input.subject,
    difficulty: "MEDIUM",
    questionType: "MULTIPLE_CHOICE",
    count: input.count,
    microTopic: input.microTopic ?? input.subTopics?.[0] ?? "Adaptive Practice",
    topic: input.topic,
    subTopics: input.subTopics,
    provider,
    mode: "ON_DEMAND"
  };
  const globalPlanSlots = buildQuestionGenerationPlan(globalGenerationInput).flatMap((plan) => Array.from({ length: plan.count }, () => plan));
  const generated: Question[] = [];
  let cursor = 0;

  for (const item of difficultyPlan) {
    if (item.count <= 0) continue;
    const planSlice = globalPlanSlots.slice(cursor, cursor + item.count);
    cursor += item.count;
    const generationInput: QuestionGenerationInput = {
      subject: input.subject,
      difficulty: item.difficulty,
      questionType: "MULTIPLE_CHOICE",
      count: item.count,
      microTopic: input.microTopic ?? input.subTopics?.[0] ?? "Adaptive Practice",
      topic: input.topic,
      subTopics: input.subTopics,
      provider,
      mode: "ON_DEMAND"
    };
    generated.push(...(await generateAdminQuestions(generationInput, compressGenerationPlan(planSlice.length ? planSlice : buildQuestionGenerationPlan(generationInput)))));
  }

  questionBank.push(...generated);
  return generated;
}

function compressGenerationPlan(planItems: QuestionGenerationPlanItem[]) {
  const map = new Map<string, QuestionGenerationPlanItem>();
  for (const item of planItems) {
    const key = `${item.syllabusTopicSlug}:${item.subTopic}`;
    const current = map.get(key);
    if (current) {
      current.count += 1;
    } else {
      map.set(key, { ...item, count: 1 });
    }
  }
  return [...map.values()];
}

function normalizeDifficultyMix(count: number, mix?: { easy: number; medium: number; hard: number }): Array<{ difficulty: Difficulty; count: number }> {
  const easy = Math.max(0, Math.min(count, mix?.easy ?? Math.floor(count * 0.25)));
  const medium = Math.max(0, Math.min(count - easy, mix?.medium ?? Math.floor(count * 0.5)));
  const hard = Math.max(0, Math.min(count - easy - medium, mix?.hard ?? count - easy - medium));
  const assigned = easy + medium + hard;
  return [
    { difficulty: "EASY", count: easy },
    { difficulty: "MEDIUM", count: medium },
    { difficulty: "HARD", count: hard + Math.max(0, count - assigned) }
  ];
}

export function getExam(examId: string) {
  const exam = store().exams.find((candidate) => candidate.id === examId) ?? null;
  if (!exam) return null;
  exam.questions = exam.questions.map((item) => {
    const latestQuestion = questionBank.find((question) => question.id === item.question.id);
    return latestQuestion ? { ...item, question: enrichQuestionSyllabus(latestQuestion) } : { ...item, question: enrichQuestionSyllabus(item.question) };
  });
  return exam;
}

export function saveAnswer(examId: string, questionId: string, studentResponse: string, isMarkedForReview: boolean) {
  const exam = getExam(examId);
  if (!exam) throw new Error("Exam not found.");

  const existing = exam.answers[questionId];
  const answer = {
    id: existing?.id ?? uid("answer"),
    examId,
    questionId,
    studentResponse,
    isMarkedForReview,
    submittedAt: new Date().toISOString()
  };
  exam.answers[questionId] = { ...existing, ...answer };
  addAuditLog(examId, "ANSWER_SAVED", { questionId, isMarkedForReview });
  return exam.answers[questionId];
}

export function submitExam(examId: string) {
  const exam = getExam(examId);
  if (!exam) throw new Error("Exam not found.");

  let correct = 0;
  let rawScore = 0;
  let totalMarks = 0;
  for (const item of exam.questions) {
    const answer = exam.answers[item.question.id];
    const isCorrect = gradeResponse(item.question.answer, answer?.studentResponse, item.question.questionType);
    const hasResponse = Boolean(normaliseAnswer(answer?.studentResponse));
    const points = item.points ?? item.question.marksAvailable ?? 1;
    totalMarks += points;

    if (isCorrect) {
      correct += 1;
      rawScore += points;
    }
    exam.answers[item.question.id] = {
      id: answer?.id ?? uid("answer"),
      examId,
      questionId: item.question.id,
      studentResponse: answer?.studentResponse ?? "",
      isMarkedForReview: answer?.isMarkedForReview ?? false,
      isCorrect,
      awardedPoints: isCorrect ? points : 0,
      aiFeedback: isCorrect
        ? "Correct. Nice work."
        : hasResponse
          ? `${item.question.explanation} Try a similar question from ${item.question.microTopic}.`
          : `No answer was submitted. ${item.question.explanation}`,
      submittedAt: new Date().toISOString()
    };
  }

  exam.correctAnswers = correct;
  exam.rawScore = rawScore;
  exam.totalMarks = totalMarks;
  exam.score = Math.round((rawScore / Math.max(totalMarks, 1)) * 100);
  exam.status = "GRADED";
  exam.completedAt = new Date().toISOString();
  addAuditLog(examId, "EXAM_SUBMITTED", { score: exam.score });
  return exam;
}

export function addAuditLog(examId: string, eventType: string, details?: unknown) {
  const log: AuditEvent = {
    id: uid("audit"),
    examId,
    eventType,
    eventTimestamp: new Date().toISOString(),
    details
  };
  store().auditLogs.push(log);
  return log;
}

export function examsForStudent(studentId: string) {
  return store().exams.filter((exam) => exam.studentId === studentId);
}

function gradeResponse(questionAnswer: string, studentResponse: string | undefined, questionType: string) {
  const expected = normaliseAnswer(questionAnswer);
  const actual = normaliseAnswer(studentResponse);
  if (!actual) return false;
  if (questionType === "MULTIPLE_CHOICE") return actual === expected;

  const expectedKeywords = expected
    .split(" ")
    .filter((word) => word.length > 3 && !["that", "when", "with", "from", "into", "they", "them"].includes(word));
  const actualWords = new Set(actual.split(" ").filter(Boolean));
  const matchingKeywords = expectedKeywords.filter((word) => actualWords.has(word));

  return actual === expected || matchingKeywords.length >= Math.min(3, expectedKeywords.length);
}

export function upsertInsight(insight: Omit<Insight, "id" | "generatedAt">) {
  const data = store();
  const existing = data.insights.find(
    (item) => item.userId === insight.userId && item.insightType === insight.insightType && item.expiresAt > new Date().toISOString()
  );
  if (existing) return existing;

  const created: Insight = {
    ...insight,
    id: uid("insight"),
    generatedAt: new Date().toISOString()
  };
  data.insights.push(created);
  return created;
}
