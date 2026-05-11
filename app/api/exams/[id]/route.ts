import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { listStudentsFor } from "@/backend/auth/users";
import { getExam } from "@/backend/exams/exam-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const exam = getExam(id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const studentIds = user.role === "PARENT" ? (await listStudentsFor(user.id)).map((student) => student.id) : [user.id];
  if (user.role !== "ADMIN" && !studentIds.includes(exam.studentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ exam });
}
