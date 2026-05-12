import { questionBank } from "@/backend/questions/question-bank";
import type { LlmGenerationMeta, LlmProvider, PlatformConfig, Question, QuestionBankStats, QuestionGenerationJob, QuestionGenerationSchedule } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { enrichQuestionSyllabus, topicForSubTopic } from "@/backend/syllabus/registry";
import { nextScheduleRun } from "@/backend/platform/defaults";
import { store } from "@/backend/platform/app-store";
import { addAuditLog } from "@/backend/exams/audit-log-service";
import { callQuestionGenerationLlm } from "@/backend/questions/llm-question-client";
import { buildQuestionGenerationPlan } from "@/backend/questions/generation-planner";
import { buildLlmQuestionPrompt } from "@/backend/questions/question-prompt-builder";
import type { GeneratedQuestionResult, QuestionGenerationInput, QuestionGenerationPlanItem } from "@/backend/questions/question-generation-types";
import { filterUniqueQuestions, questionBankStatsFromDatabase, saveQuestionsToQuestionMaster } from "@/backend/questions/question-master-repository";

export type { QuestionGenerationInput, QuestionGenerationPlanItem } from "@/backend/questions/question-generation-types";
export { buildQuestionGenerationPlan } from "@/backend/questions/generation-planner";

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

export async function questionBankStatsLive(): Promise<QuestionBankStats> {
  return (await questionBankStatsFromDatabase()) ?? questionBankStats();
}

export async function questionGenerationAdminState() {
  const data = store();
  return {
    stats: await questionBankStatsLive(),
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
    const unique = await filterUniqueQuestions(generated.questions);
    const acceptedQuestions = unique.accepted.map((candidate) => candidate.question);
    questionBank.push(...acceptedQuestions);
    const persistence = await saveQuestionsToQuestionMaster(acceptedQuestions, input.provider === "INTERNAL" ? "admin_internal_generation" : "admin_llm_generation");
    job.status = "COMPLETED";
    job.generatedCount = acceptedQuestions.length;
    job.error = unique.rejected.length ? `${unique.rejected.length} duplicate question(s) were rejected before saving.` : undefined;
    job.completedAt = new Date().toISOString();
    addAuditLog("admin_question_generation", "QUESTION_FLAGGED", {
      jobId: job.id,
      subject: input.subject,
      count: acceptedQuestions.length,
      provider: input.provider,
      mode: input.mode
    });
    return { job, stats: await questionBankStatsLive(), duplicateReport: { rejected: unique.rejected, persistence } };
  } catch (error) {
    job.status = "FAILED";
    job.error = error instanceof Error ? error.message : "Question generation failed";
    job.completedAt = new Date().toISOString();
  }

  return { job, stats: await questionBankStatsLive() };
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
  const basePrompt = input.promptOverride?.trim() || buildLlmQuestionPrompt(input, generationPlan);
  const batched = input.provider === "INTERNAL" || input.promptOverride?.trim()
    ? await generateSingleAdminCandidateBatch(input, generationPlan, basePrompt)
    : await generateBatchedAdminCandidates(input, generationPlan);

  return {
    generationPlan,
    prompt: batched.prompt,
    questions: batched.unique.evaluated.map((candidate) => ({
      ...candidate.question,
      id: uid("q_candidate"),
      uniqueness: candidate.uniqueness
    })),
    generationMeta: { ...batched.meta, duplicateRejectedCount: batched.unique.rejected.length, duplicateRejections: batched.unique.rejected },
    llmQuota: llmQuotaSnapshot(),
    stats: await questionBankStatsLive()
  };
}

async function generateSingleAdminCandidateBatch(input: QuestionGenerationInput & { promptOverride?: string }, generationPlan: QuestionGenerationPlanItem[], basePrompt: string) {
  let prompt = basePrompt;
  let result = input.promptOverride?.trim()
    ? await generateAdminQuestionCandidatesWithPrompt(input, generationPlan, input.promptOverride.trim())
    : await generateAdminQuestionCandidatesOnly(input, generationPlan);
  let unique = await filterUniqueQuestions(result.questions);
  if (input.provider !== "INTERNAL" && unique.rejected.length > 0) {
    prompt = buildDuplicateRepairPrompt(basePrompt, unique.rejected.length);
    result = await generateAdminQuestionCandidatesWithPrompt(input, generationPlan, prompt);
    unique = await filterUniqueQuestions(result.questions);
  }
  return { prompt, meta: result.meta, unique };
}

async function generateBatchedAdminCandidates(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  const batchSize = 10;
  const batches = splitGenerationPlanIntoBatches(generationPlan, batchSize);
  const questions: Question[] = [];
  const batchMeta: NonNullable<LlmGenerationMeta["batches"]> = [];
  let meta: LlmGenerationMeta | null = null;

  for (const [index, batchPlan] of batches.entries()) {
    const batchCount = batchPlan.reduce((sum, item) => sum + item.count, 0);
    const batchInput: QuestionGenerationInput = { ...input, count: batchCount };
    const result = await generateAdminQuestionCandidatesOnly(batchInput, batchPlan);
    const evaluatedBatch = await filterUniqueQuestions([...questions, ...result.questions], { includeVector: true });
    const uniqueNewQuestions = evaluatedBatch.evaluated.slice(questions.length).filter((item) => item.uniqueness.isUnique).map((item) => item.question);
    questions.push(...uniqueNewQuestions);
    meta = mergeGenerationMeta(meta, result.meta, input.count);
    batchMeta.push({
      index: index + 1,
      requestedCount: batchCount,
      returnedCount: result.questions.length,
      uniqueCount: uniqueNewQuestions.length,
      duplicateCount: Math.max(0, result.questions.length - uniqueNewQuestions.length),
      provider: result.meta.actualProvider
    });

    if (questions.length >= input.count) break;
    if (result.questions.length === 0) break;
  }

  const unique = await filterUniqueQuestions(questions.slice(0, input.count));
  return {
    prompt: buildLlmQuestionPrompt(input, generationPlan),
    meta: {
      ...(meta ?? {
        requestedProvider: input.provider,
        actualProvider: "INTERNAL" as const,
        source: "INTERNAL_FALLBACK" as const,
        requestedCount: input.count,
        llmReturnedCount: 0,
        fallbackCount: 0
      }),
      requestedCount: input.count,
      batches: batchMeta
    },
    unique
  };
}

function splitGenerationPlanIntoBatches(generationPlan: QuestionGenerationPlanItem[], batchSize: number) {
  const batches: QuestionGenerationPlanItem[][] = [];
  let mixedSmallBatch: QuestionGenerationPlanItem[] = [];
  let mixedSmallBatchCount = 0;

  function flushMixedSmallBatch() {
    if (!mixedSmallBatch.length) return;
    batches.push(mixedSmallBatch);
    mixedSmallBatch = [];
    mixedSmallBatchCount = 0;
  }

  for (const item of generationPlan) {
    if (item.count < batchSize) {
      if (mixedSmallBatchCount + item.count > batchSize) flushMixedSmallBatch();
      mixedSmallBatch.push(item);
      mixedSmallBatchCount += item.count;
      if (mixedSmallBatchCount === batchSize) flushMixedSmallBatch();
      continue;
    }

    flushMixedSmallBatch();
    let remaining = item.count;
    while (remaining > 0) {
      const count = Math.min(batchSize, remaining);
      batches.push([{ ...item, count }]);
      remaining -= count;
    }
  }
  flushMixedSmallBatch();
  return batches;
}

function mergeGenerationMeta(current: LlmGenerationMeta | null, next: LlmGenerationMeta, requestedCount: number): LlmGenerationMeta {
  if (!current) return { ...next, requestedCount };
  return {
    ...next,
    requestedProvider: current.requestedProvider,
    actualProvider: next.actualProvider,
    source: next.source === "LLM" || current.source === "LLM" ? "LLM" : "INTERNAL_FALLBACK",
    requestedCount,
    llmReturnedCount: current.llmReturnedCount + next.llmReturnedCount,
    fallbackCount: current.fallbackCount + next.fallbackCount,
    groq: next.groq ?? current.groq,
    gemini: next.gemini ?? current.gemini
  };
}

async function generateAdminQuestionCandidatesOnly(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]): Promise<GeneratedQuestionResult> {
  if (input.provider === "INTERNAL") {
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

  const response = await callQuestionGenerationLlm(input.provider, buildLlmQuestionPrompt(input, generationPlan));
  const parsed = response?.text ? parseGeneratedQuestions(input, response.text) : null;
  return {
    questions: (parsed ?? []).slice(0, input.count),
    meta: {
      ...(response?.meta ?? {
        requestedProvider: input.provider,
        actualProvider: "INTERNAL" as const,
        source: "INTERNAL_FALLBACK" as const,
        requestedCount: 0,
        llmReturnedCount: 0,
        fallbackCount: 0
      }),
      requestedCount: input.count,
      llmReturnedCount: parsed?.length ?? 0,
      fallbackCount: 0
    }
  };
}

async function generateAdminQuestionCandidatesWithPrompt(
  input: QuestionGenerationInput,
  generationPlan: QuestionGenerationPlanItem[],
  prompt: string
): Promise<GeneratedQuestionResult> {
  if (input.provider === "INTERNAL") return generateAdminQuestionCandidatesOnly(input, generationPlan);

  const response = await callQuestionGenerationLlm(input.provider, prompt);
  const parsed = response?.text ? parseGeneratedQuestions(input, response.text) : null;
  return {
    questions: (parsed ?? []).slice(0, input.count),
    meta: {
      ...(response?.meta ?? {
        requestedProvider: input.provider,
        actualProvider: "INTERNAL" as const,
        source: "INTERNAL_FALLBACK" as const,
        requestedCount: 0,
        llmReturnedCount: 0,
        fallbackCount: 0
      }),
      requestedCount: input.count,
      llmReturnedCount: parsed?.length ?? 0,
      fallbackCount: 0
    }
  };
}

function buildDuplicateRepairPrompt(basePrompt: string, duplicateCount: number) {
  return [
    basePrompt,
    "",
    `The previous generation contained ${duplicateCount} duplicate or near-duplicate item(s). Regenerate the complete batch from scratch.`,
    "Hard requirement: every question in this response must be unique from every other question in the same response.",
    "Use different wording, values, correct answers, distractors, passages, names, SVG shapes, SVG layout, and reasoning pattern for every item.",
    "Do a silent final duplicate audit before returning JSON. If any two items feel similar, replace one before responding."
  ].join("\n");
}

export async function importGeneratedQuestions(questions: Question[]) {
  const imported = questions.map((question) => ({
    ...enrichQuestionSyllabus(question),
    id: uid("q_admin_import")
  }));
  const unique = await filterUniqueQuestions(imported);
  const acceptedQuestions = unique.accepted.map((candidate) => candidate.question);
  questionBank.push(...acceptedQuestions);
  const persistence = await saveQuestionsToQuestionMaster(acceptedQuestions, "admin_import");
  const job: QuestionGenerationJob = {
    id: uid("qgen_import"),
    subject: acceptedQuestions[0]?.subjectType ?? imported[0]?.subjectType ?? "MATHS",
    difficulty: acceptedQuestions[0]?.difficultyLevel ?? imported[0]?.difficultyLevel ?? "MEDIUM",
    questionType: acceptedQuestions[0]?.questionType ?? imported[0]?.questionType ?? "MULTIPLE_CHOICE",
    count: imported.length,
    microTopic: Array.from(new Set(acceptedQuestions.map((question) => question.microTopic))).join(", ") || "Admin import",
    topic: acceptedQuestions[0]?.topic ?? imported[0]?.topic,
    subTopics: Array.from(new Set(acceptedQuestions.map((question) => question.microTopic))),
    provider: "INTERNAL",
    status: acceptedQuestions.length ? "COMPLETED" : "FAILED",
    mode: "ON_DEMAND",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    generatedCount: acceptedQuestions.length,
    error: unique.rejected.length ? `${unique.rejected.length} duplicate question(s) rejected.` : undefined
  };
  store().questionGenerationJobs.push(job);
  return { imported: acceptedQuestions, rejected: unique.rejected, persistence, job, stats: await questionBankStatsLive() };
}

export async function runScheduledQuestionGenerationNow() {
  const schedule = store().questionGenerationSchedule;
  if (!schedule.enabled) throw new Error("Scheduled question generation is disabled.");
  const result = await runQuestionGeneration({ ...schedule, mode: "SCHEDULED" });
  updateQuestionGenerationSchedule({ nextRunAt: nextScheduleRun(schedule.frequency, schedule.runAt) });
  return result;
}

export async function generateAdminQuestions(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]): Promise<GeneratedQuestionResult> {
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
    const difficulty = plan.difficultyMix[index % Math.max(plan.difficultyMix.length, 1)] ?? input.difficulty;
    const questionType = plan.questionTypeMix[index % Math.max(plan.questionTypeMix.length, 1)] ?? input.questionType;
    const isMultipleChoice = questionType === "MULTIPLE_CHOICE";
    return {
      ...enrichQuestionSyllabus(source),
      id: uid("q_admin_llm"),
      subjectType: input.subject,
      questionType,
      difficultyLevel: difficulty,
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
      estimatedSeconds: difficulty === "EASY" ? 45 : difficulty === "MEDIUM" ? 60 : 75
    };
  });
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
        options: (question.questionType ?? input.questionType) === "MULTIPLE_CHOICE" ? question.options ?? [] : [],
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
