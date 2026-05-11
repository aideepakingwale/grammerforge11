import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { runScheduledQuestionGenerationNow, updateQuestionGenerationSchedule } from "@/backend/exams/demo-store";

const schema = z.object({
  enabled: z.boolean(),
  subject: z.enum(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]),
  questionType: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  count: z.number().int().min(1).max(100),
  microTopic: z.string().min(2).max(120),
  topic: z.string().min(2).max(160).optional(),
  subTopics: z.array(z.string().min(2).max(120)).optional(),
  provider: z.enum(["GEMINI", "GROQ", "INTERNAL"]),
  frequency: z.enum(["DAILY", "WEEKLY"]),
  runAt: z.string().regex(/^\d{2}:\d{2}$/)
});

export async function PATCH(request: Request) {
  await requireUser(["ADMIN"]);
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json({ schedule: updateQuestionGenerationSchedule(input) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save schedule" }, { status: 400 });
  }
}

export async function POST() {
  await requireUser(["ADMIN"]);
  try {
    return NextResponse.json(await runScheduledQuestionGenerationNow());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not run scheduled generation" }, { status: 400 });
  }
}
