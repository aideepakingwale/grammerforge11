import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { updatePlan } from "@/backend/plans/plan-service";

const featureSchema = z.record(z.string(), z.boolean());
const schema = z.object({
  name: z.string().min(1).optional(),
  monthlyPricePence: z.number().int().min(0).optional(),
  examLimitMonthly: z.number().int().min(0).nullable().optional(),
  aiInsightLimitMonthly: z.number().int().min(0).nullable().optional(),
  dailySubjectLimit: z.number().int().min(0).nullable().optional(),
  questionsPerExam: z.number().int().min(1).max(80).optional(),
  durationMinutes: z.number().int().min(1).max(100).optional(),
  allowAllSubjectsDaily: z.boolean().optional(),
  allowRepeatSubjectSameDay: z.boolean().optional(),
  customExamEnabled: z.boolean().optional(),
  customExamMaxQuestions: z.number().int().min(0).max(80).optional(),
  customExamMaxMinutes: z.number().int().min(0).max(100).optional(),
  llmCustomExamsPerDay: z.number().int().min(0).max(10).optional(),
  shareExamEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  features: featureSchema.optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ tier: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { tier } = await params;
    if (!["FOUNDATION", "ALPHA", "VELOCITY", "APEX"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    const input = schema.parse(await request.json());
    return NextResponse.json({ plan: updatePlan(tier as "FOUNDATION" | "ALPHA" | "VELOCITY" | "APEX", input) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update plan" }, { status: 400 });
  }
}
