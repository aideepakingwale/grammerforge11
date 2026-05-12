import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { adminDeleteExam, adminUpdateExam } from "@/backend/admin/exam-admin-service";

const schema = z.object({
  status: z.enum(["DRAFT", "IN_PROGRESS", "PAUSED", "SUBMITTED", "GRADED", "ABANDONED"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    return NextResponse.json({ exam: adminUpdateExam(id, schema.parse(await request.json())) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update exam" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    return NextResponse.json(adminDeleteExam(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete exam" }, { status: 400 });
  }
}
