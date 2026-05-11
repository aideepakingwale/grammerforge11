import type { Exam, Subject } from "@/backend/shared/types";
import { subjectLabel } from "@/backend/shared/utils";

export type PerformanceBand = "STRONG" | "POSITIVE" | "FOCUS";

export type PerformanceRow = {
  key: string;
  label: string;
  subject?: Subject;
  topic?: string;
  correct: number;
  total: number;
  marksAwarded: number;
  marksAvailable: number;
  accuracy: number;
  band: PerformanceBand;
};

function bandFor(accuracy: number): PerformanceBand {
  if (accuracy >= 80) return "STRONG";
  if (accuracy >= 60) return "POSITIVE";
  return "FOCUS";
}

function toRow(key: string, label: string, value: Omit<PerformanceRow, "key" | "label" | "accuracy" | "band">): PerformanceRow {
  const accuracy = Math.round((value.marksAwarded / Math.max(value.marksAvailable, 1)) * 100);
  return {
    key,
    label,
    ...value,
    accuracy,
    band: bandFor(accuracy)
  };
}

export function buildPerformanceAnalytics(exams: Exam[]) {
  const graded = exams.filter((exam) => exam.status === "GRADED");
  const bySubject = new Map<Subject, Omit<PerformanceRow, "key" | "label" | "accuracy" | "band">>();
  const byTopic = new Map<string, Omit<PerformanceRow, "key" | "label" | "accuracy" | "band">>();

  for (const exam of graded) {
    for (const item of exam.questions) {
      const answer = exam.answers[item.question.id];
      const marksAvailable = item.points ?? item.question.marksAvailable ?? 1;
      const marksAwarded = answer?.awardedPoints ?? (answer?.isCorrect ? marksAvailable : 0);
      const topic = item.question.topic ?? item.question.microTopic;

      const subjectCurrent = bySubject.get(exam.subject) ?? {
        subject: exam.subject,
        correct: 0,
        total: 0,
        marksAwarded: 0,
        marksAvailable: 0
      };
      subjectCurrent.correct += answer?.isCorrect ? 1 : 0;
      subjectCurrent.total += 1;
      subjectCurrent.marksAwarded += marksAwarded;
      subjectCurrent.marksAvailable += marksAvailable;
      bySubject.set(exam.subject, subjectCurrent);

      const topicKey = `${exam.subject}:${topic}`;
      const topicCurrent = byTopic.get(topicKey) ?? {
        subject: exam.subject,
        topic,
        correct: 0,
        total: 0,
        marksAwarded: 0,
        marksAvailable: 0
      };
      topicCurrent.correct += answer?.isCorrect ? 1 : 0;
      topicCurrent.total += 1;
      topicCurrent.marksAwarded += marksAwarded;
      topicCurrent.marksAvailable += marksAvailable;
      byTopic.set(topicKey, topicCurrent);
    }
  }

  const subjects = [...bySubject.entries()].map(([subject, value]) => toRow(subject, subjectLabel(subject), value));
  const topics = [...byTopic.entries()]
    .map(([key, value]) => toRow(key, `${subjectLabel(value.subject!)} / ${value.topic}`, value))
    .sort((a, b) => a.accuracy - b.accuracy);

  return {
    subjects: subjects.sort((a, b) => a.accuracy - b.accuracy),
    topics,
    strengths: [...topics].filter((item) => item.band === "STRONG").sort((a, b) => b.accuracy - a.accuracy).slice(0, 4),
    positives: [...topics].filter((item) => item.band === "POSITIVE").sort((a, b) => b.accuracy - a.accuracy).slice(0, 4),
    focusAreas: topics.filter((item) => item.band === "FOCUS").slice(0, 5)
  };
}
