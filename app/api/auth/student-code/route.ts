import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/backend/auth/session";
import { pendingStudentUserId, trustStudentDevice } from "@/backend/auth/student-device";
import { verifyStudentAccessCode } from "@/backend/auth/users";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/)
});

export async function POST(request: Request) {
  try {
    const userId = await pendingStudentUserId();
    if (!userId) return NextResponse.json({ error: "Student login challenge expired. Please sign in again." }, { status: 401 });
    const input = schema.parse(await request.json());
    const user = await verifyStudentAccessCode(String(userId), input.code);
    if (!user) return NextResponse.json({ error: "Invalid student access code." }, { status: 401 });
    await trustStudentDevice(user);
    await createSession(user);
    return NextResponse.json({ user, trustedDevice: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify student access code" }, { status: 400 });
  }
}
