import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { adminDeleteUser, adminUpdateUser } from "@/backend/admin/user-admin-service";

const schema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(["STUDENT", "PARENT", "ADMIN"]).optional(),
  subscriptionTier: z.enum(["FOUNDATION", "ALPHA", "VELOCITY", "APEX"]).optional(),
  parentId: z.string().nullable().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const user = adminUpdateUser(id, input);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update user" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    return NextResponse.json(adminDeleteUser(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete user" }, { status: 400 });
  }
}
