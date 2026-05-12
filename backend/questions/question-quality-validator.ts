import type { Question } from "@/backend/shared/types";

export function validateQuestionQuality(question: Question): string | null {
  if (question.questionType === "MULTIPLE_CHOICE") {
    if (question.options.length !== 4) return "MCQ must have exactly 4 options.";
    if (!question.options.some((option) => sameText(option.content, question.answer))) {
      return "MCQ answer must exactly match one option.";
    }
  }

  const multipleError = validateNotMultipleQuestion(question);
  if (multipleError) return multipleError;

  return null;
}

function validateNotMultipleQuestion(question: Question) {
  const text = `${question.stimulus?.content ?? ""} ${question.questionData.content}`;
  const match = text.match(/not\s+a\s+multiple\s+of\s+(\d+)/i);
  if (!match) return null;

  const divisor = Number(match[1]);
  if (!Number.isFinite(divisor) || divisor === 0) return null;

  const numericOptions = question.options
    .map((option) => Number(String(option.content).match(/-?\d+(?:\.\d+)?/)?.[0]))
    .filter((value) => Number.isFinite(value));
  const answerValue = Number(String(question.answer).match(/-?\d+(?:\.\d+)?/)?.[0]);
  if (!Number.isFinite(answerValue)) return null;

  const nonMultiples = numericOptions.filter((value) => value % divisor !== 0);
  if (answerValue % divisor === 0) {
    return `Math validation failed: ${answerValue} is a multiple of ${divisor}, so it cannot be the answer to a NOT multiple question.`;
  }
  if (nonMultiples.length !== 1) {
    return `Math validation failed: expected exactly one option that is not a multiple of ${divisor}, found ${nonMultiples.length}.`;
  }
  return null;
}

function sameText(left: string, right: string) {
  return normalize(left) === normalize(right);
}

function normalize(value: string) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}
