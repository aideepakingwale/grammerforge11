import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { importGeneratedQuestions } from "@/backend/questions/question-generation-service";

const payloadSchema = z.object({
  mode: z.enum(["text", "svg"]),
  content: z.string(),
  title: z.string().optional()
});

const stimulusSchema = z.object({
  title: z.string(),
  mode: z.enum(["passage", "text", "svg", "table"]),
  content: z.string(),
  caption: z.string().optional()
}).optional();

const questionSchema = z.object({
  id: z.string(),
  subjectType: z.enum(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]),
  questionType: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  questionData: payloadSchema,
  instruction: z.string().optional(),
  stimulus: stimulusSchema,
  options: z.array(payloadSchema),
  answer: z.string(),
  explanation: z.string(),
  difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]),
  topic: z.string().optional(),
  microTopic: z.string(),
  syllabusTopicSlug: z.string().optional(),
  examBoardTags: z.array(z.string()).optional(),
  skillTags: z.array(z.string()).optional(),
  estimatedSeconds: z.number().optional(),
  marksAvailable: z.number().optional(),
  scoringWeight: z.number().optional()
});

const schema = z.object({
  questions: z.array(questionSchema).min(1).max(100)
});

export async function POST(request: Request) {
  await requireUser(["ADMIN"]);
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json(importGeneratedQuestions(input.questions));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import selected questions" }, { status: 400 });
  }
}
