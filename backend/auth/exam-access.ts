import type { SafeUser } from "@/backend/shared/types";
import type { Exam } from "@/backend/shared/types";
import { listStudentsFor } from "@/backend/exams/demo-store";

export function canWriteExam(user: SafeUser, exam: Exam) {
  if (user.role === "ADMIN") return true;
  if (user.role === "STUDENT") return exam.studentId === user.id;
  if (user.role === "PARENT") {
    return listStudentsFor(user.id).some((student) => student.id === exam.studentId);
  }
  return false;
}
