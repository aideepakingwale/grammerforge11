import type { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db/prisma";
import type { Question, QuestionBankStats } from "@/backend/shared/types";

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
    await prisma.questionMaster.createMany({
      data: questions.map((question) => ({
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
        curriculumTag: "UK 11+ Grammar",
        source,
        isActive: true
      })),
      skipDuplicates: true
    });
    return { persisted: questions.length, skipped: 0 };
  } catch (error) {
    throw new Error(databaseImportMessage(error));
  }
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
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
