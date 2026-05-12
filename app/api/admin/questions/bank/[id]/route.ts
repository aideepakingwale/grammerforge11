import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { deleteQuestionBankRecord, updateQuestionBankRecord } from "@/backend/questions/question-master-repository";

const schema = z.object({
  difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]).optional(),
  questionType: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]).optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    return NextResponse.json({ question: await updateQuestionBankRecord(id, schema.parse(await request.json())) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update question" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    return NextResponse.json(await deleteQuestionBankRecord(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete question" }, { status: 400 });
  }
}
