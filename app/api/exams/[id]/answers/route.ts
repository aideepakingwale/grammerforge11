import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { getExam, saveAnswer } from "@/backend/exams/demo-store";
import { canWriteExam } from "@/backend/auth/exam-access";

const schema = z.object({
  questionId: z.string(),
  studentResponse: z.string().default(""),
  isMarkedForReview: z.boolean().default(false)
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const exam = getExam(id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  if (!canWriteExam(user, exam)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const input = schema.parse(await request.json());
  const answer = saveAnswer(id, input.questionId, input.studentResponse, input.isMarkedForReview);
  return NextResponse.json({ answer });
}
