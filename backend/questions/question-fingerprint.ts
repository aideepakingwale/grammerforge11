import crypto from "node:crypto";
import type { Question } from "@/backend/shared/types";

export type QuestionFingerprint = {
  contentHash: string;
  semanticHash: string;
  fingerprintText: string;
};

export function fingerprintQuestion(question: Question): QuestionFingerprint {
  const fingerprintText = normalizeQuestionText([
    question.subjectType,
    question.questionType,
    question.topic,
    question.microTopic,
    payloadText(question.stimulus),
    payloadText(question.questionData),
    ...question.options.map(payloadText),
    normalizeAnswer(question.answer)
  ].filter(Boolean).join(" "));

  const semanticText = normalizeQuestionText([
    question.subjectType,
    question.questionType,
    question.topic,
    question.microTopic,
    semanticPayloadText(question.stimulus),
    semanticPayloadText(question.questionData)
  ].filter(Boolean).join(" "));

  return {
    contentHash: hash(fingerprintText),
    semanticHash: hash(semanticText),
    fingerprintText
  };
}

export function normalizeQuestionText(value: string) {
  return value
    .toLowerCase()
    .replace(/<svg[\s\S]*?<\/svg>/g, (svg) => normalizeSvg(svg))
    .replace(/&nbsp;/g, " ")
    .replace(/[^a-z0-9+\-*/=<>.%£$]+/g, " ")
    .replace(/\b(the|a|an|please|choose|select|answer|following|question)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function payloadText(payload: Question["questionData"] | Question["stimulus"] | undefined) {
  if (!payload) return "";
  return `${payload.mode} ${payload.title ?? ""} ${payload.content}`;
}

function semanticPayloadText(payload: Question["questionData"] | Question["stimulus"] | undefined) {
  if (!payload) return "";
  const content = payload.mode === "svg" ? normalizeSvg(payload.content) : payload.content;
  return `${payload.mode} ${content}`;
}

function normalizeSvg(svg: string) {
  return svg
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .replace(/\s?(aria-label|role|class|style|id)=['"][^'"]*['"]/g, "")
    .replace(/#[0-9a-f]{3,8}/gi, "#color")
    .trim();
}

function normalizeAnswer(answer: string) {
  if (answer.trim().startsWith("<svg")) return normalizeSvg(answer);
  return answer;
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
