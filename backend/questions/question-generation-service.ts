import { questionBank } from "@/backend/questions/question-bank";
import type { LlmProvider, PlatformConfig, Question, QuestionBankStats, QuestionGenerationJob, QuestionGenerationSchedule } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { enrichQuestionSyllabus, topicForSubTopic } from "@/backend/syllabus/registry";
import { nextScheduleRun } from "@/backend/platform/defaults";
import { store } from "@/backend/platform/app-store";
import { addAuditLog } from "@/backend/exams/audit-log-service";
import { callQuestionGenerationLlm } from "@/backend/questions/llm-question-client";
import { buildQuestionGenerationPlan } from "@/backend/questions/generation-planner";
import { buildLlmQuestionPrompt } from "@/backend/questions/question-prompt-builder";
import type { GeneratedQuestionResult, QuestionGenerationInput, QuestionGenerationPlanItem } from "@/backend/questions/question-generation-types";

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
