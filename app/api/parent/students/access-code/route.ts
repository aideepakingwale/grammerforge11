import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { generateStudentAccessCode } from "@/backend/auth/users";

const schema = z.object({
  studentId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const parent = await requireUser(["PARENT"]);
    const input = schema.parse(await request.json());
    const accessCode = await generateStudentAccessCode({ parentId: parent.id, studentId: input.studentId });
    return NextResponse.json({
      accessCode,
      message: "New one-time student device code generated. It expires in 24 hours and is consumed after use."
    });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: error.status === 403 ? "Forbidden" : "Unauthenticated" }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate access code." }, { status: 400 });
  }
}
