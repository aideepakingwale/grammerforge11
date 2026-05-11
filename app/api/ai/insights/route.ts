import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { dashboardInsights } from "@/backend/ai/insights";
import { findUser, listStudentsFor, planHasFeature } from "@/backend/exams/demo-store";

const schema = z.object({
  audience: z.enum(["parent", "student"]),
  studentId: z.string().optional()
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!planHasFeature(user.subscriptionTier, "BASIC_ANALYTICS")) {
    return NextResponse.json({ error: "AI insights are not enabled for this subscription." }, { status: 402 });
  }
  const input = schema.parse(await request.json());
  const student =
    user.role === "STUDENT"
      ? user
      : findUser(input.studentId ?? listStudentsFor(user.id)[0]?.id ?? "");
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ insight: await dashboardInsights(student, input.audience) });
}
