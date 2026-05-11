import { questionBank } from "@/backend/questions/question-bank";
import { examPatternFor } from "@/backend/exams/exam-patterns";
import type { Difficulty, Exam, Question, Subject } from "@/backend/shared/types";
import { normaliseAnswer, uid } from "@/backend/shared/utils";
import { enrichQuestionSyllabus } from "@/backend/syllabus/registry";
import { store } from "@/backend/platform/app-store";
import { addAuditLog } from "@/backend/exams/audit-log-service";
import { buildQuestionGenerationPlan, generateAdminQuestions, type QuestionGenerationInput, type QuestionGenerationPlanItem } from "@/backend/questions/question-generation-service";

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

