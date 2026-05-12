import type { ExamStatus } from "@/backend/shared/types";
import { store } from "@/backend/platform/app-store";

export function adminListExams() {
  const data = store();
  return data.exams.map((exam) => {
    const student = data.users.find((user) => user.id === exam.studentId);
    return {
      id: exam.id,
      studentId: exam.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown student",
      subject: exam.subject,
      status: exam.status,
      score: exam.score,
      totalQuestions: exam.totalQuestions,
      startedAt: exam.startedAt,
      completedAt: exam.completedAt,
      isProctored: exam.isProctored
    };
  });
}

export function adminUpdateExam(examId: string, input: { status?: ExamStatus }) {
  const exam = store().exams.find((candidate) => candidate.id === examId);
  if (!exam) throw new Error("Exam not found.");
  if (input.status) exam.status = input.status;
  return exam;
}

export function adminDeleteExam(examId: string) {
  const data = store();
  const before = data.exams.length;
  data.exams = data.exams.filter((exam) => exam.id !== examId);
  if (data.exams.length === before) throw new Error("Exam not found.");
  return { ok: true };
}
