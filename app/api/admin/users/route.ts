import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { adminCreateUser, adminListUsers } from "@/backend/admin/user-admin-service";

const schema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  username: z.string().min(4).max(40).optional().or(z.literal("")),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["STUDENT", "PARENT", "ADMIN"]),
  subscriptionTier: z.enum(["FOUNDATION", "ALPHA", "VELOCITY", "APEX"]).default("FOUNDATION"),
  parentId: z.string().nullable().optional()
});

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({ users: adminListUsers() });
}

export async function POST(request: Request) {
  await requireUser(["ADMIN"]);
  try {
    const input = schema.parse(await request.json());
    const user = await adminCreateUser(input);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create user" }, { status: 400 });
  }
}
