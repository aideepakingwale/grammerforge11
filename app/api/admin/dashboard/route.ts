import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import {
  adminListUsers,
  getPlatformConfig,
  listPlans,
  listPublicPages,
  platformAnalytics,
  questionGenerationAdminState
} from "@/backend/exams/demo-store";

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({
    analytics: platformAnalytics(),
    users: adminListUsers(),
    config: getPlatformConfig(),
    plans: listPlans(),
    pages: listPublicPages(),
    questionGeneration: questionGenerationAdminState()
  });
}
