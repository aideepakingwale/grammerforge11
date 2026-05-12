import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { browseQuestionBank } from "@/backend/questions/question-master-repository";
import type { Subject } from "@/backend/shared/types";

const subjects = new Set(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]);
const sortFields = new Set(["updatedAt", "topic", "microTopic", "difficultyLevel", "questionType"]);
const sortDirections = new Set(["asc", "desc"]);

export async function GET(request: Request) {
  await requireUser(["ADMIN"]);
  const url = new URL(request.url);
  const subject = url.searchParams.get("subject") || undefined;
  const topic = url.searchParams.get("topic") || undefined;
  const microTopic = url.searchParams.get("microTopic") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? 25);
  const page = Number(url.searchParams.get("page") ?? 1);
  const sortBy = url.searchParams.get("sortBy") || "updatedAt";
  const sortDir = url.searchParams.get("sortDir") || "desc";
  return NextResponse.json(await browseQuestionBank({
    subject: subject && subjects.has(subject) ? subject as Subject : undefined,
    topic,
    microTopic,
    limit,
    page,
    sortBy: sortFields.has(sortBy) ? sortBy as Parameters<typeof browseQuestionBank>[0]["sortBy"] : "updatedAt",
    sortDir: sortDirections.has(sortDir) ? sortDir as Parameters<typeof browseQuestionBank>[0]["sortDir"] : "desc"
  }));
}
