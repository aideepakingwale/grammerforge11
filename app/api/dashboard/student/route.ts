import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { dashboardInsights } from "@/backend/ai/insights";
import { examsForStudent, getPlanForTier } from "@/backend/exams/demo-store";

export async function GET() {
  const user = await requireUser(["STUDENT"]);
  const exams = examsForStudent(user.id);
  const insight = await dashboardInsights(user, "student");
  const plan = getPlanForTier(user.subscriptionTier);
  return NextResponse.json({ user, exams, insight, plan });
}
