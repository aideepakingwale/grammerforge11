import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/backend/auth/session";
import { verifyUser } from "@/backend/auth/users";
import { createPendingStudentChallenge } from "@/backend/auth/student-device";

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await verifyUser(input.identifier, input.password);
    if (!result) return NextResponse.json({ error: "Invalid username/email or password" }, { status: 401 });
    if (result.status === "CODE_REQUIRED") {
      await createPendingStudentChallenge(result.user.id);
      return NextResponse.json({
        requiresStudentCode: true,
        message: "Enter the 6-digit student access code from your parent to trust this device."
      }, { status: 202 });
    }
    await createSession(result.user);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not sign in" }, { status: 401 });
  }
}
