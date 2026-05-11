import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { questionGenerationAdminState } from "@/backend/questions/question-generation-service";

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json(questionGenerationAdminState());
}
