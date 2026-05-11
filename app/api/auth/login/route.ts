import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/backend/auth/session";
import { verifyUser } from "@/backend/auth/users";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await verifyUser(input.email, input.password);
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    await createSession(user);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not sign in" }, { status: 401 });
  }
}
