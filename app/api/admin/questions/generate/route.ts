import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { generateQuestionCandidates } from "@/backend/questions/question-generation-service";

const schema = z.object({
  subject: z.enum(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]),
  questionType: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  count: z.number().int().min(1).max(100),
  microTopic: z.string().min(2).max(120),
  topic: z.string().min(2).max(160).optional(),
  topics: z.array(z.string().min(2).max(160)).optional(),
  subTopics: z.array(z.string().min(2).max(120)).optional(),
  difficulties: z.array(z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"])).optional(),
  questionTypes: z.array(z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"])).optional(),
  provider: z.enum(["GEMINI", "GROQ", "INTERNAL"]),
  promptOverride: z.string().min(20).optional()
});

export async function POST(request: Request) {
  await requireUser(["ADMIN"]);
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json(await generateQuestionCandidates({ ...input, mode: "ON_DEMAND" }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Question generation failed" }, { status: 400 });
  }
}
