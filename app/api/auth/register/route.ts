import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/backend/auth/users";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["STUDENT", "PARENT"]),
  parentId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await registerUser(input);
    return NextResponse.json({
      user,
      message: "Registration received. Please check your email and confirm your account before signing in."
    }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed" }, { status: 400 });
  }
}
