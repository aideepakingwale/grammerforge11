import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { createLinkedStudent, listStudentsFor } from "@/backend/auth/users";

const schema = z.object({
  username: z.string().min(4).max(40),
  password: z.string().min(8),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80)
});

export async function GET() {
  const parent = await requireUser(["PARENT"]);
  return NextResponse.json({ students: await listStudentsFor(parent.id) });
}

export async function POST(request: Request) {
  try {
    const parent = await requireUser(["PARENT"]);
    const input = schema.parse(await request.json());
    const { student, accessCode } = await createLinkedStudent({ ...input, parentId: parent.id });
    return NextResponse.json({
      student,
      accessCode,
      message: "Student profile created. Give the username, password, and 6-digit access code to the student. This device code is only needed the first time on a new machine."
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: error.status === 403 ? "Forbidden" : "Unauthenticated" }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create linked student." }, { status: 400 });
  }
}
