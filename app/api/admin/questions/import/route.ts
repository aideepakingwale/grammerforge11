import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { importGeneratedQuestions } from "@/backend/questions/question-generation-service";

const payloadSchema = z.object({
  mode: z.enum(["text", "svg", "passage", "table"]).default("text"),
  content: z.coerce.string(),
  title: z.string().optional()
});

const stimulusSchema = z.preprocess(
  (value) => value === null ? undefined : value,
  z.object({
    title: z.string().optional(),
    mode: z.enum(["passage", "text", "svg", "table"]),
    content: z.coerce.string(),
    caption: z.string().optional()
  }).transform((value) => ({ ...value, title: value.title ?? stimulusTitle(value.mode) })).optional()
);

const questionSchema = z.object({
  id: z.string(),
  subjectType: z.enum(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]),
  questionType: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  questionData: payloadSchema.transform(normalizeQuestionPayload),
  instruction: z.string().optional(),
  stimulus: stimulusSchema,
  options: z.array(payloadSchema.transform(normalizeQuestionPayload)).default([]),
  answer: z.coerce.string(),
  explanation: z.coerce.string().default("Review the worked method and try a similar question."),
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
    return NextResponse.json(await importGeneratedQuestions(input.questions));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: z.prettifyError(error) }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import selected questions" }, { status: 400 });
  }
}

function normalizeQuestionPayload(payload: z.infer<typeof payloadSchema>) {
  return {
    mode: payload.mode === "svg" ? "svg" as const : "text" as const,
    content: payload.content,
    title: payload.title
  };
}

function stimulusTitle(mode: "passage" | "text" | "svg" | "table") {
  if (mode === "svg") return "Figure";
  if (mode === "table") return "Table";
  if (mode === "passage") return "Passage";
  return "Stimulus";
}
