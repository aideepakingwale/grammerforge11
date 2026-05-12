import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { browseQuestionBank } from "@/backend/questions/question-master-repository";
import type { Subject } from "@/backend/shared/types";

const subjects = new Set(["MATHS", "ENGLISH", "VERBAL_REASONING", "NON_VERBAL_REASONING"]);

export async function GET(request: Request) {
  await requireUser(["ADMIN"]);
  const url = new URL(request.url);
  const subject = url.searchParams.get("subject") || undefined;
  const topic = url.searchParams.get("topic") || undefined;
  const microTopic = url.searchParams.get("microTopic") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? 25);
  return NextResponse.json(await browseQuestionBank({
    subject: subject && subjects.has(subject) ? subject as Subject : undefined,
    topic,
    microTopic,
    limit
  }));
}
