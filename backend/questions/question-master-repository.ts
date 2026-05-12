import type { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db/prisma";
import type { Question, QuestionBankBrowserResult, QuestionBankStats, Subject } from "@/backend/shared/types";
import { questionBank } from "@/backend/questions/question-bank";
import { fingerprintQuestion } from "@/backend/questions/question-fingerprint";
import { findVectorDuplicate, saveQuestionEmbeddings } from "@/backend/questions/question-embedding-service";
import { validateQuestionQuality } from "@/backend/questions/question-quality-validator";

const emptySubjectStats = {
  MATHS: 0,
  ENGLISH: 0,
  VERBAL_REASONING: 0,
  NON_VERBAL_REASONING: 0
};

const emptyDifficultyStats = {
  EASY: 0,
  MEDIUM: 0,
  HARD: 0,
  ADVANCED: 0
};

export function hasConfiguredQuestionDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function questionBankStatsFromDatabase(): Promise<QuestionBankStats | null> {
  if (!hasConfiguredQuestionDatabase()) return null;

  try {
    const [total, subjectRows, difficultyRows, llmGenerated] = await Promise.all([
      prisma.questionMaster.count({ where: { isActive: true } }),
      prisma.questionMaster.groupBy({
        by: ["subjectType"],
        where: { isActive: true },
        _count: { _all: true }
      }),
      prisma.questionMaster.groupBy({
        by: ["difficultyLevel"],
        where: { isActive: true },
        _count: { _all: true }
      }),
      prisma.questionMaster.count({
        where: {
          isActive: true,
          OR: [
            { source: { contains: "llm" } },
            { source: { contains: "admin_import" } }
          ]
        }
      })
    ]);

    const bySubject = { ...emptySubjectStats };
    const byDifficulty = { ...emptyDifficultyStats };
    subjectRows.forEach((row) => {
      bySubject[row.subjectType] = row._count._all;
    });
    difficultyRows.forEach((row) => {
      byDifficulty[row.difficultyLevel] = row._count._all;
    });

    return { total, bySubject, byDifficulty, llmGenerated };
  } catch {
    return null;
  }
}

export async function saveQuestionsToQuestionMaster(questions: Question[], source = "admin_import") {
  if (!questions.length || !hasConfiguredQuestionDatabase()) {
    return { persisted: 0, skipped: questions.length };
  }

  try {
    const unique = await filterUniqueQuestions(questions, { includeStarterBank: false });
    await prisma.questionMaster.createMany({
      data: unique.accepted.map(({ question, fingerprint }) => ({
        subjectType: question.subjectType,
        topic: question.topic ?? question.microTopic,
        syllabusTopicSlug: question.syllabusTopicSlug ?? slugify(question.topic ?? question.microTopic),
        questionType: question.questionType,
        title: question.questionData.title,
        instruction: question.instruction,
        stimulusData: toJson(question.stimulus),
        passageTitle: question.stimulus?.mode === "passage" ? question.stimulus.title : undefined,
        passageText: question.stimulus?.mode === "passage" ? question.stimulus.content : undefined,
        questionData: toRequiredJson(question.questionData),
        options: toJson(question.options),
        option1: toJson(question.options[0]),
        option2: toJson(question.options[1]),
        option3: toJson(question.options[2]),
        option4: toJson(question.options[3]),
        answer: question.answer,
        explanation: question.explanation,
        difficultyLevel: question.difficultyLevel,
        microTopic: question.microTopic,
        skillTags: question.skillTags ?? [],
        examBoardTags: question.examBoardTags ?? [],
        estimatedSeconds: question.estimatedSeconds,
        marksAvailable: question.marksAvailable ?? 1,
        scoringWeight: question.scoringWeight ?? 1,
        contentHash: fingerprint.contentHash,
        semanticHash: fingerprint.semanticHash,
        duplicateGroupKey: fingerprint.semanticHash,
        curriculumTag: "UK 11+ Grammar",
        source,
        isActive: true
      })),
      skipDuplicates: true
    });
    const savedRows = await prisma.questionMaster.findMany({
      where: { contentHash: { in: unique.accepted.map((item) => item.fingerprint.contentHash) } },
      select: { id: true, contentHash: true }
    });
    await saveQuestionEmbeddings(
      unique.accepted.map((item) => item.question),
      new Map(savedRows.flatMap((row) => row.contentHash ? [[row.contentHash, row.id] as const] : []))
    );
    return {
      persisted: unique.accepted.length,
      skipped: unique.rejected.length,
      duplicates: unique.rejected
    };
  } catch (error) {
    throw new Error(databaseImportMessage(error));
  }
}

export async function browseQuestionBank(input: { subject?: Subject; topic?: string; microTopic?: string; limit?: number }): Promise<QuestionBankBrowserResult> {
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  if (!hasConfiguredQuestionDatabase()) return browseStarterQuestionBank(input, limit);

  try {
    const where = {
      isActive: true,
      ...(input.subject ? { subjectType: input.subject } : {}),
      ...(input.topic ? { topic: input.topic } : {}),
      ...(input.microTopic ? { microTopic: input.microTopic } : {})
    };
    const [total, topicRows, microTopicRows, rows] = await Promise.all([
      prisma.questionMaster.count({ where }),
      prisma.questionMaster.groupBy({
        by: ["subjectType", "topic"],
        where: { isActive: true, ...(input.subject ? { subjectType: input.subject } : {}) },
        _count: { _all: true },
        orderBy: [{ subjectType: "asc" }, { topic: "asc" }]
      }),
      prisma.questionMaster.groupBy({
        by: ["subjectType", "topic", "microTopic"],
        where: { isActive: true, ...(input.subject ? { subjectType: input.subject } : {}), ...(input.topic ? { topic: input.topic } : {}) },
        _count: { _all: true },
        orderBy: [{ subjectType: "asc" }, { topic: "asc" }, { microTopic: "asc" }]
      }),
      prisma.questionMaster.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          subjectType: true,
          questionType: true,
          questionData: true,
          stimulusData: true,
          options: true,
          answer: true,
          explanation: true,
          difficultyLevel: true,
          topic: true,
          microTopic: true,
          syllabusTopicSlug: true,
          examBoardTags: true,
          skillTags: true,
          estimatedSeconds: true,
          marksAvailable: true,
          scoringWeight: true,
          instruction: true
        }
      })
    ]);
    return {
      filters: { subject: input.subject, topic: input.topic, microTopic: input.microTopic },
      total,
      source: "database",
      topics: topicRows.map((row) => ({ subjectType: row.subjectType, topic: row.topic, count: row._count._all })),
      microTopics: microTopicRows.map((row) => ({ subjectType: row.subjectType, topic: row.topic, microTopic: row.microTopic, count: row._count._all })),
      questions: rows.map(mapQuestionMasterRow)
    };
  } catch {
    return browseStarterQuestionBank(input, limit);
  }
}

export async function filterUniqueQuestions(questions: Question[], options: { includeStarterBank?: boolean; includeVector?: boolean } = {}) {
  const candidates = questions.map((question) => ({ question, fingerprint: fingerprintQuestion(question) }));
  const includeStarterBank = options.includeStarterBank ?? true;
  const existingMemoryHashes = includeStarterBank ? new Set(questionBank.map((question) => fingerprintQuestion(question).contentHash)) : new Set<string>();
  const existingMemorySemanticHashes = includeStarterBank ? new Set(questionBank.map((question) => fingerprintQuestion(question).semanticHash)) : new Set<string>();
  const seenContent = new Set<string>();
  const seenSemantic = new Set<string>();
  const rejected: Array<{ questionId: string; reason: string; topic?: string; microTopic: string }> = [];
  const includeVector = options.includeVector ?? true;

  const databaseHashes = await findExistingDatabaseHashes(candidates.map((candidate) => candidate.fingerprint));

  const evaluated = [];
  for (const { question, fingerprint } of candidates) {
    let reason = validateQuestionQuality(question) ?? (
      seenContent.has(fingerprint.contentHash) ? "Duplicate inside the generated batch" :
      seenSemantic.has(fingerprint.semanticHash) ? "Near-duplicate inside the generated batch" :
      databaseHashes.content.has(fingerprint.contentHash) ? "Already exists in question_master" :
      databaseHashes.semantic.has(fingerprint.semanticHash) ? "Near-duplicate already exists in question_master" :
      existingMemoryHashes.has(fingerprint.contentHash) ? "Already exists in the starter question bank" :
      existingMemorySemanticHashes.has(fingerprint.semanticHash) ? "Near-duplicate already exists in the starter question bank" :
      "");

    if (!reason && includeVector) {
      const vectorDuplicate = await findVectorDuplicate(question);
      if (vectorDuplicate) {
        reason = `Vector near-duplicate (${Math.round(vectorDuplicate.similarity * 100)}% similar) to existing question ${vectorDuplicate.questionId}: ${vectorDuplicate.questionPreview}`;
      }
    }

    seenContent.add(fingerprint.contentHash);
    seenSemantic.add(fingerprint.semanticHash);

    if (!reason) {
      evaluated.push({ question, fingerprint, uniqueness: { isUnique: true, contentHash: fingerprint.contentHash, semanticHash: fingerprint.semanticHash } });
      continue;
    }
    rejected.push({
      questionId: question.id,
      reason,
      topic: question.topic,
      microTopic: question.microTopic
    });
    evaluated.push({ question, fingerprint, uniqueness: { isUnique: false, reason, contentHash: fingerprint.contentHash, semanticHash: fingerprint.semanticHash } });
  }

  return { accepted: evaluated.filter((item) => item.uniqueness.isUnique), evaluated, rejected };
}

async function findExistingDatabaseHashes(fingerprints: Array<{ contentHash: string; semanticHash: string }>) {
  const content = new Set<string>();
  const semantic = new Set<string>();
  if (!hasConfiguredQuestionDatabase() || !fingerprints.length) return { content, semantic };

  const contentHashes = Array.from(new Set(fingerprints.map((fingerprint) => fingerprint.contentHash)));
  const semanticHashes = Array.from(new Set(fingerprints.map((fingerprint) => fingerprint.semanticHash)));
  const rows = await prisma.questionMaster.findMany({
    where: {
      OR: [
        { contentHash: { in: contentHashes } },
        { semanticHash: { in: semanticHashes } },
        { contentHash: null },
        { semanticHash: null }
      ]
    },
    select: {
      id: true,
      subjectType: true,
      questionType: true,
      questionData: true,
      stimulusData: true,
      options: true,
      answer: true,
      explanation: true,
      difficultyLevel: true,
      topic: true,
      microTopic: true,
      syllabusTopicSlug: true,
      examBoardTags: true,
      skillTags: true,
      estimatedSeconds: true,
      marksAvailable: true,
      scoringWeight: true,
      contentHash: true,
      semanticHash: true
    }
  });

  rows.forEach((row) => {
    const rowFingerprint = row.contentHash && row.semanticHash ? null : fingerprintQuestion({
      id: row.id,
      subjectType: row.subjectType,
      questionType: row.questionType,
      questionData: row.questionData as Question["questionData"],
      stimulus: row.stimulusData as Question["stimulus"],
      options: (row.options ?? []) as Question["options"],
      answer: row.answer,
      explanation: row.explanation ?? "",
      difficultyLevel: row.difficultyLevel,
      topic: row.topic,
      microTopic: row.microTopic,
      syllabusTopicSlug: row.syllabusTopicSlug,
      examBoardTags: row.examBoardTags,
      skillTags: row.skillTags,
      estimatedSeconds: row.estimatedSeconds ?? undefined,
      marksAvailable: Number(row.marksAvailable),
      scoringWeight: Number(row.scoringWeight)
    });
    content.add(row.contentHash ?? rowFingerprint?.contentHash ?? "");
    semantic.add(row.semanticHash ?? rowFingerprint?.semanticHash ?? "");
  });
  content.delete("");
  semantic.delete("");
  return { content, semantic };
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

function browseStarterQuestionBank(input: { subject?: Subject; topic?: string; microTopic?: string }, limit: number): QuestionBankBrowserResult {
  const filtered = questionBank.filter((question) =>
    (!input.subject || question.subjectType === input.subject) &&
    (!input.topic || question.topic === input.topic) &&
    (!input.microTopic || question.microTopic === input.microTopic)
  );
  return {
    filters: { subject: input.subject, topic: input.topic, microTopic: input.microTopic },
    total: filtered.length,
    source: "starter_bank",
    topics: countBy(questionBank.filter((question) => !input.subject || question.subjectType === input.subject), (question) => `${question.subjectType}|||${question.topic ?? question.microTopic}`).map(([key, count]) => {
      const [subjectType, topic] = key.split("|||");
      return { subjectType: subjectType as Subject, topic, count };
    }),
    microTopics: countBy(questionBank.filter((question) => (!input.subject || question.subjectType === input.subject) && (!input.topic || question.topic === input.topic)), (question) => `${question.subjectType}|||${question.topic ?? question.microTopic}|||${question.microTopic}`).map(([key, count]) => {
      const [subjectType, topic, microTopic] = key.split("|||");
      return { subjectType: subjectType as Subject, topic, microTopic, count };
    }),
    questions: filtered.slice(0, limit)
  };
}

function countBy<T>(items: T[], keyFor: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(keyFor(item), (counts.get(keyFor(item)) ?? 0) + 1));
  return Array.from(counts.entries()).sort((left, right) => left[0].localeCompare(right[0]));
}

function mapQuestionMasterRow(row: {
  id: string;
  subjectType: Subject;
  questionType: Question["questionType"];
  questionData: unknown;
  stimulusData: unknown;
  options: unknown;
  answer: string;
  explanation: string | null;
  difficultyLevel: Question["difficultyLevel"];
  topic: string;
  microTopic: string;
  syllabusTopicSlug: string;
  examBoardTags: string[];
  skillTags: string[];
  estimatedSeconds: number | null;
  marksAvailable: unknown;
  scoringWeight: unknown;
  instruction: string | null;
}): Question {
  return {
    id: row.id,
    subjectType: row.subjectType,
    questionType: row.questionType,
    questionData: row.questionData as Question["questionData"],
    stimulus: (row.stimulusData ?? undefined) as Question["stimulus"],
    options: (row.options ?? []) as Question["options"],
    answer: row.answer,
    explanation: row.explanation ?? "",
    difficultyLevel: row.difficultyLevel,
    topic: row.topic,
    microTopic: row.microTopic,
    syllabusTopicSlug: row.syllabusTopicSlug,
    examBoardTags: row.examBoardTags,
    skillTags: row.skillTags,
    estimatedSeconds: row.estimatedSeconds ?? undefined,
    marksAvailable: Number(row.marksAvailable),
    scoringWeight: Number(row.scoringWeight),
    instruction: row.instruction ?? undefined
  };
}

function toRequiredJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mixed-11-plus";
}

function databaseImportMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  if (message.includes("does not exist") || message.includes("question_master")) {
    return "Question import could not persist because the question_master table is missing. Run `npm run db:push` against the production database, then retry.";
  }
  return `Question import could not persist to the master question bank: ${message}`;
}
