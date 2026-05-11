import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { getExam, submitExam } from "@/backend/exams/exam-service";
import { canWriteExam } from "@/backend/auth/exam-access";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const exam = getExam(id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  if (!canWriteExam(user, exam)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ exam: submitExam(id) });
}
