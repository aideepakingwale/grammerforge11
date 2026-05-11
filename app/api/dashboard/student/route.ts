import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { dashboardInsights } from "@/backend/ai/insights";
import { examsForStudent } from "@/backend/exams/demo-store";
import { getPlanForTier } from "@/backend/plans/plan-service";

export async function GET() {
  const user = await requireUser(["STUDENT"]);
  const exams = examsForStudent(user.id);
  const insight = await dashboardInsights(user, "student");
  const plan = getPlanForTier(user.subscriptionTier);
  return NextResponse.json({ user, exams, insight, plan });
}
