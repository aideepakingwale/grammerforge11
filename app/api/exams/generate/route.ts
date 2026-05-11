import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { findUser, listStudentsFor } from "@/backend/auth/users";
import { createExam } from "@/backend/exams/demo-store";
import { planHasFeature, validateExamAccess } from "@/backend/plans/plan-service";
import { examPatternFor } from "@/backend/exams/exam-patterns";
import type { Tier } from "@/backend/shared/types";

const schema = z.object({
  subject: z.enum(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]),
  difficulty: z.string().optional(),
  isProctored: z.boolean().default(false),
  studentId: z.string().optional(),
  mode: z.enum(["STANDARD", "CUSTOM_LLM"]).default("STANDARD"),
  questionCount: z.number().int().min(1).max(80).optional(),
  durationMinutes: z.number().int().min(1).max(100).optional(),
  topic: z.string().min(2).max(160).optional(),
  subTopics: z.array(z.string().min(2).max(120)).optional(),
  microTopic: z.string().min(2).max(120).optional(),
  difficultyMix: z.object({
    easy: z.number().int().min(0).max(80).default(0),
    medium: z.number().int().min(0).max(80).default(0),
    hard: z.number().int().min(0).max(80).default(0)
  }).optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await request.json());
    const isCustomLlm = input.mode === "CUSTOM_LLM";

    if (!planHasFeature(user.subscriptionTier, "STANDARD_EXAMS")) {
      return NextResponse.json({ error: "Standard exams are not enabled for this subscription." }, { status: 402 });
    }

    if (input.isProctored && !planHasFeature(user.subscriptionTier, "SECURE_PROCTORING")) {
      return NextResponse.json({ error: "Secure proctoring is enabled only for tiers where the admin has switched on that feature." }, { status: 402 });
    }

    const parentStudents = user.role === "PARENT" ? await listStudentsFor(user.id) : [];
    const studentId =
      user.role === "STUDENT"
        ? user.id
        : input.studentId ?? parentStudents[0]?.id;

    if (!studentId) return NextResponse.json({ error: "No linked student found." }, { status: 400 });
    if (user.role === "PARENT" && !parentStudents.some((student) => student.id === studentId)) {
      return NextResponse.json({ error: "This student is not linked to your parent account." }, { status: 403 });
    }
    const planOwnerTier: Tier = user.role === "STUDENT" ? user.subscriptionTier : user.subscriptionTier;
    const plan = validateExamAccess({
      studentId,
      subject: input.subject,
      tier: planOwnerTier,
      isCustomLlm
    });

    if (isCustomLlm && user.role !== "PARENT" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apex custom LLM exams must be configured by a parent or admin." }, { status: 403 });
    }

    if (!(await findUser(studentId))) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const syllabusPattern = examPatternFor(input.subject);
    const pattern = plan.tier === "VELOCITY" || plan.tier === "APEX"
      ? { questions: syllabusPattern.totalQuestions, minutes: syllabusPattern.durationMinutes }
      : { questions: plan.questionsPerExam, minutes: plan.durationMinutes };
    const questionCount = isCustomLlm
      ? Math.min(input.questionCount ?? plan.customExamMaxQuestions, plan.customExamMaxQuestions)
      : pattern.questions;
    const durationMinutes = isCustomLlm
      ? Math.min(input.durationMinutes ?? plan.customExamMaxMinutes, plan.customExamMaxMinutes)
      : pattern.minutes;

    const exam = await createExam({
      studentId,
      subject: input.subject,
      difficulty: input.difficulty,
      isProctored: input.isProctored,
      questionCount,
      durationSeconds: durationMinutes * 60,
      isCustomLlm,
      difficultyMix: input.difficultyMix,
      topic: input.topic,
      subTopics: input.subTopics,
      microTopic: input.microTopic
    });
    return NextResponse.json({ exam, plan, requested: { questionCount, durationMinutes, customLlm: isCustomLlm } });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate exam" }, { status: 400 });
  }
}
