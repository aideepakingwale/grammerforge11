import bcrypt from "bcryptjs";
import { questionBank } from "@/backend/questions/question-bank";
import { examPatternFor } from "@/backend/exams/exam-patterns";
import type {
  AuditEvent,
  Exam,
  Insight,
  PlatformConfig,
  PublicPage,
  QuestionBankStats,
  Role,
  SafeUser,
  Subject,
  SubscriptionPlanConfig,
  Tier,
  Difficulty,
  LlmGenerationMeta,
  LlmProvider,
  Question,
  QuestionGenerationJob,
  QuestionGenerationSchedule,
  QuestionType
} from "@/backend/shared/types";
import { normaliseAnswer, uid } from "@/backend/shared/utils";
import { enrichQuestionSyllabus, syllabusRegistry, topicForSubTopic } from "@/backend/syllabus/registry";
import {
  defaultPlatformConfig,
  defaultPlans,
  defaultPublicPages,
  defaultQuestionGenerationSchedule,
  nextScheduleRun
} from "@/backend/platform/defaults";

type StoredUser = SafeUser & { passwordHash: string };

type GeneratedQuestionResult = {
  questions: Question[];
  meta: LlmGenerationMeta;
};

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
    llmQuota: llmQuotaSnapshot(),
    schedule: data.questionGenerationSchedule,
    jobs: data.questionGenerationJobs.slice().reverse().slice(0, 12)
  };
}

export function llmQuotaSnapshot(now = new Date(), configInput?: PlatformConfig) {
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  const today = now.toISOString().slice(0, 10);
  const usage = store().questionGenerationJobs.filter((job) => job.createdAt.slice(0, 10) === today);
  const providerUsage = (provider: LlmProvider) => usage
    .filter((job) => job.provider === provider && job.status === "COMPLETED")
    .reduce((sum, job) => sum + job.generatedCount, 0);
  const configured = {
    GEMINI: Boolean(process.env.GEMINI_API_KEY),
    GROQ: Boolean(process.env.GROQ_API_KEY),
    INTERNAL: true
  };
  const config = configInput ?? store().platformConfig;
  const adminDailyLimit = Math.max(config.aiDailyLimitPremium, config.aiDailyLimitPro, config.aiDailyLimitFree);
  const rows: Array<{ provider: LlmProvider; enabled: boolean; dailyLimit: number; note: string }> = [
    {
      provider: "GEMINI",
      enabled: config.geminiEnabled,
      dailyLimit: adminDailyLimit,
      note: "Estimated platform-side question generation budget. Gemini's exact remaining free-tier quota is not exposed by API."
    },
    {
      provider: "GROQ",
      enabled: config.groqEnabled,
      dailyLimit: adminDailyLimit,
      note: "Estimated platform-side question generation budget. Groq's exact remaining free-tier quota is not exposed by API."
    },
    {
      provider: "INTERNAL",
      enabled: true,
      dailyLimit: 10000,
      note: "Internal fallback has no external token quota."
    }
  ];
  return rows.map((row) => {
    const usedToday = providerUsage(row.provider);
    return {
      provider: row.provider,
      enabled: row.enabled,
      configured: configured[row.provider],
      dailyLimit: row.dailyLimit,
      usedToday,
      remainingToday: row.provider === "INTERNAL" ? null : Math.max(0, row.dailyLimit - usedToday),
      resetAt: reset.toISOString(),
      note: row.note
    };
  });
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
  topics?: string[];
  subTopics?: string[];
  difficulties?: Difficulty[];
  questionTypes?: QuestionType[];
  provider: LlmProvider;
  mode: "ON_DEMAND" | "SCHEDULED";
};

type QuestionGenerationPlanItem = {
  topic: string;
  syllabusTopicSlug: string;
  subTopic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
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
    topic: input.topics?.length ? input.topics.join(", ") : input.topic,
    topics: input.topics,
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
    questionBank.push(...generated.questions);
    job.status = "COMPLETED";
    job.generatedCount = generated.questions.length;
    job.completedAt = new Date().toISOString();
    addAuditLog("admin_question_generation", "QUESTION_FLAGGED", {
      jobId: job.id,
      subject: input.subject,
      count: generated.questions.length,
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

export function previewQuestionGeneration(input: QuestionGenerationInput) {
  const generationPlan = buildQuestionGenerationPlan(input);
  return {
    generationPlan,
    prompt: buildLlmQuestionPrompt(input, generationPlan)
  };
}

export async function generateQuestionCandidates(input: QuestionGenerationInput & { promptOverride?: string }) {
  const generationPlan = buildQuestionGenerationPlan(input);
  const result = input.promptOverride?.trim()
    ? await generateAdminQuestionsWithPrompt(input, generationPlan, input.promptOverride.trim())
    : await generateAdminQuestions(input, generationPlan);

  return {
    generationPlan,
    prompt: input.promptOverride?.trim() || buildLlmQuestionPrompt(input, generationPlan),
    questions: result.questions.map((question) => ({ ...question, id: uid("q_candidate") })),
    generationMeta: result.meta,
    llmQuota: llmQuotaSnapshot(),
    stats: questionBankStats()
  };
}

export function importGeneratedQuestions(questions: Question[]) {
  const imported = questions.map((question) => ({
    ...enrichQuestionSyllabus(question),
    id: uid("q_admin_import")
  }));
  questionBank.push(...imported);
  const job: QuestionGenerationJob = {
    id: uid("qgen_import"),
    subject: imported[0]?.subjectType ?? "MATHS",
    difficulty: imported[0]?.difficultyLevel ?? "MEDIUM",
    questionType: imported[0]?.questionType ?? "MULTIPLE_CHOICE",
    count: imported.length,
    microTopic: Array.from(new Set(imported.map((question) => question.microTopic))).join(", ") || "Admin import",
    topic: imported[0]?.topic,
    subTopics: Array.from(new Set(imported.map((question) => question.microTopic))),
    provider: "INTERNAL",
    status: "COMPLETED",
    mode: "ON_DEMAND",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    generatedCount: imported.length
  };
  store().questionGenerationJobs.push(job);
  return { imported, job, stats: questionBankStats() };
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
  const requestedTopics = input.topics?.length ? input.topics : input.topic ? [input.topic] : [];
  const normalizedRequestedTopics = requestedTopics.map((item) => item.trim().toLowerCase()).filter(Boolean);
  const selectedTopics = normalizedRequestedTopics.length
    ? topicGroups.filter((topic) => normalizedRequestedTopics.includes(topic.name.toLowerCase()) || normalizedRequestedTopics.includes(topic.slug.toLowerCase()))
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

  const difficulties = input.difficulties?.length ? input.difficulties : [input.difficulty];
  const questionTypes = input.questionTypes?.length ? input.questionTypes : [input.questionType];
  const combinations = normalizedPool.flatMap((topicItem) =>
    difficulties.flatMap((difficulty) =>
      questionTypes.map((questionType) => ({
        ...topicItem,
        difficulty,
        questionType
      }))
    )
  );
  const base = Math.floor(input.count / combinations.length);
  let remainder = input.count % combinations.length;
  return combinations
    .map((item) => {
      const count = base + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return { ...item, count };
    })
    .filter((item) => item.count > 0);
}

async function generateAdminQuestions(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]): Promise<GeneratedQuestionResult> {
  const llmResult = input.provider === "INTERNAL" ? null : await generateQuestionsWithConfiguredLlm(input, generationPlan);
  if (llmResult?.questions.length) {
    const trimmed = llmResult.questions.slice(0, input.count);
    if (trimmed.length >= input.count) {
      return {
        questions: trimmed,
        meta: { ...llmResult.meta, requestedCount: input.count, llmReturnedCount: llmResult.questions.length, fallbackCount: 0 }
      };
    }
    const fallback = buildFallbackAdminQuestions(input, generationPlan, input.count, trimmed.length);
    const fallbackTopUp = fallback.slice(0, input.count - trimmed.length);
    return {
      questions: [...trimmed, ...fallbackTopUp],
      meta: { ...llmResult.meta, requestedCount: input.count, llmReturnedCount: llmResult.questions.length, fallbackCount: fallbackTopUp.length }
    };
  }

  const fallback = buildFallbackAdminQuestions(input, generationPlan, input.count, 0);
  return {
    questions: fallback,
    meta: {
      requestedProvider: input.provider,
      actualProvider: "INTERNAL",
      source: "INTERNAL_FALLBACK",
      requestedCount: input.count,
      llmReturnedCount: 0,
      fallbackCount: fallback.length
    }
  };
}

function buildFallbackAdminQuestions(
  input: QuestionGenerationInput,
  generationPlan: QuestionGenerationPlanItem[],
  count: number,
  offset: number
): Question[] {
  const sourceQuestions = questionBank.filter((question) => question.subjectType === input.subject);
  const fallback = sourceQuestions[0] ?? questionBank[0];
  const planSlots = generationPlan.flatMap((plan) => Array.from({ length: plan.count }, () => plan));
  return Array.from({ length: count }, (_, localIndex) => {
    const index = localIndex + offset;
    const source = sourceQuestions[index % Math.max(sourceQuestions.length, 1)] ?? fallback;
    const plan = planSlots[index % Math.max(planSlots.length, 1)] ?? generationPlan[0];
    const isMultipleChoice = plan.questionType === "MULTIPLE_CHOICE";
    return {
      ...enrichQuestionSyllabus(source),
      id: uid("q_admin_llm"),
      subjectType: input.subject,
      questionType: plan.questionType,
      difficultyLevel: plan.difficulty,
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
      estimatedSeconds: plan.difficulty === "EASY" ? 45 : plan.difficulty === "MEDIUM" ? 60 : 75
    };
  });
}

async function generateAdminQuestionsWithPrompt(
  input: QuestionGenerationInput,
  generationPlan: QuestionGenerationPlanItem[],
  prompt: string
): Promise<GeneratedQuestionResult> {
  const response = input.provider === "INTERNAL" ? null : await callQuestionGenerationLlm(input.provider, prompt);
  if (response?.text) {
    const parsed = parseGeneratedQuestions(input, response.text);
    if (parsed?.length) {
      const trimmed = parsed.slice(0, input.count);
      if (trimmed.length >= input.count) {
        return {
          questions: trimmed,
          meta: { ...response.meta, requestedCount: input.count, llmReturnedCount: parsed.length, fallbackCount: 0 }
        };
      }
      const fallback = buildFallbackAdminQuestions(input, generationPlan, input.count, trimmed.length);
      const fallbackTopUp = fallback.slice(0, input.count - trimmed.length);
      return {
        questions: [...trimmed, ...fallbackTopUp],
        meta: { ...response.meta, requestedCount: input.count, llmReturnedCount: parsed.length, fallbackCount: fallbackTopUp.length }
      };
    }
  }
  return generateAdminQuestions({ ...input, provider: "INTERNAL" }, generationPlan);
}

function buildLlmQuestionPrompt(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  return [
    "You are generating original UK 11+ practice questions for a production learning platform.",
    "Return only valid JSON. Do not wrap it in markdown.",
    "The JSON shape must be: { \"questions\": [ ... ] }.",
    "Each question object must contain: questionType, difficultyLevel, topic, syllabusTopicSlug, microTopic, instruction, stimulus, questionData, options, answer, explanation, skillTags, estimatedSeconds, marksAvailable, scoringWeight.",
    "Use this content payload shape for questionData, stimulus, and options: { \"mode\": \"text\" | \"svg\" | \"passage\" | \"table\", \"title\"?: string, \"content\": string, \"caption\"?: string }.",
    "Use enum values exactly: questionType must be MULTIPLE_CHOICE or SHORT_ANSWER; difficultyLevel must be EASY, MEDIUM, HARD, or ADVANCED.",
    "For MULTIPLE_CHOICE questions, options must contain 4 plausible options and answer must match the correct option content exactly.",
    "For SHORT_ANSWER questions, options must be an empty array and answer must be a concise model answer.",
    "Every generated question must follow the requested proportional generation plan exactly, including topic, syllabusTopicSlug, subTopic, difficulty, questionType, and count.",
    "For non-verbal reasoning, use clean SVG content for visual stimuli and options.",
    "For English comprehension, include the passage in stimulus and never omit it.",
    "Questions must be age-appropriate, unambiguous, original, and suitable for timed 11+ exam practice.",
    `Subject: ${input.subject}.`,
    `Topics selected: ${(input.topics?.length ? input.topics : input.topic ? [input.topic] : ["All syllabus topics"]).join(", ")}.`,
    `Question types selected: ${(input.questionTypes?.length ? input.questionTypes : [input.questionType]).join(", ")}.`,
    `Difficulty levels selected: ${(input.difficulties?.length ? input.difficulties : [input.difficulty]).join(", ")}.`,
    `Total count: ${input.count}.`,
    "Desired import-ready JSON example:",
    "{\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"difficultyLevel\":\"MEDIUM\",\"topic\":\"Fractions, Decimals & Percentages\",\"syllabusTopicSlug\":\"fractions-decimals-percentages\",\"microTopic\":\"Equivalent Fractions\",\"instruction\":\"Choose the best answer.\",\"stimulus\":null,\"questionData\":{\"mode\":\"text\",\"content\":\"Which fraction is equivalent to 3/4?\"},\"options\":[{\"mode\":\"text\",\"content\":\"6/8\"},{\"mode\":\"text\",\"content\":\"4/6\"},{\"mode\":\"text\",\"content\":\"3/8\"},{\"mode\":\"text\",\"content\":\"7/12\"}],\"answer\":\"6/8\",\"explanation\":\"Multiplying numerator and denominator by 2 gives 6/8.\",\"skillTags\":[\"equivalent fractions\"],\"estimatedSeconds\":60,\"marksAvailable\":1,\"scoringWeight\":1}]}",
    "Generate in this exact proportional plan:",
    ...generationPlan.map((item) => `- ${item.count} question(s): topic=${item.topic}; syllabusTopicSlug=${item.syllabusTopicSlug}; subTopic=${item.subTopic}; difficulty=${item.difficulty}; questionType=${item.questionType}`)
  ].join("\n");
}

async function generateQuestionsWithConfiguredLlm(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  const prompt = buildLlmQuestionPrompt(input, generationPlan);
  const response = await callQuestionGenerationLlm(input.provider, prompt);
  if (!response?.text) return null;
  const questions = parseGeneratedQuestions(input, response.text);
  if (!questions) return null;
  return { questions, meta: response.meta };
}

function parseGeneratedQuestions(input: QuestionGenerationInput, text: string) {
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
        questionType: question.questionType ?? input.questionType,
        difficultyLevel: question.difficultyLevel ?? input.difficulty,
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

function llmProviderOrder(preferred: LlmProvider) {
  const config = store().platformConfig;
  const candidates: LlmProvider[] =
    preferred === "INTERNAL"
      ? []
      : [
          preferred,
          preferred === "GEMINI" ? "GROQ" : "GEMINI"
        ];
  return candidates.filter((provider, index, list) => {
    if (list.indexOf(provider) !== index) return false;
    if (provider === "GEMINI") return config.geminiEnabled && Boolean(process.env.GEMINI_API_KEY);
    if (provider === "GROQ") return config.groqEnabled && Boolean(process.env.GROQ_API_KEY);
    return false;
  });
}

async function callQuestionGenerationLlm(provider: LlmProvider, prompt: string) {
  for (const candidate of llmProviderOrder(provider)) {
    const result = await callSingleQuestionGenerationProvider(candidate, prompt, provider);
    if (result?.text) return result;
  }
  return null;
}

async function callSingleQuestionGenerationProvider(provider: LlmProvider, prompt: string, requestedProvider: LlmProvider) {
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
      return {
        text: json.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined,
        meta: {
          requestedProvider,
          actualProvider: "GEMINI" as const,
          source: "LLM" as const,
          requestedCount: 0,
          llmReturnedCount: 0,
          fallbackCount: 0,
          gemini: {
            promptTokenCount: json.usageMetadata?.promptTokenCount,
            candidatesTokenCount: json.usageMetadata?.candidatesTokenCount,
            totalTokenCount: json.usageMetadata?.totalTokenCount
          }
        }
      };
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
      return {
        text: json.choices?.[0]?.message?.content as string | undefined,
        meta: {
          requestedProvider,
          actualProvider: "GROQ" as const,
          source: "LLM" as const,
          requestedCount: 0,
          llmReturnedCount: 0,
          fallbackCount: 0,
          groq: {
            remainingRequests: response.headers.get("x-ratelimit-remaining-requests"),
            remainingTokens: response.headers.get("x-ratelimit-remaining-tokens"),
            limitRequests: response.headers.get("x-ratelimit-limit-requests"),
            limitTokens: response.headers.get("x-ratelimit-limit-tokens"),
            resetRequests: response.headers.get("x-ratelimit-reset-requests"),
            resetTokens: response.headers.get("x-ratelimit-reset-tokens")
          }
        }
      };
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
    const result = await generateAdminQuestions(generationInput, compressGenerationPlan(planSlice.length ? planSlice : buildQuestionGenerationPlan(generationInput)));
    generated.push(...result.questions);
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
