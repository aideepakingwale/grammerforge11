import { NextResponse } from "next/server";
import { runScheduledQuestionGenerationNow } from "@/backend/exams/demo-store";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const providedSecret = request.headers.get("authorization")?.replace("Bearer ", "") ?? url.searchParams.get("secret");

  if (configuredSecret && providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runScheduledQuestionGenerationNow());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled generation failed" }, { status: 400 });
  }
}
