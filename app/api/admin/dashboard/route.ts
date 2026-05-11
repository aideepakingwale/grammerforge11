import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { adminListUsers } from "@/backend/admin/user-admin-service";
import { getPlatformConfig } from "@/backend/admin/platform-config-service";
import { listPlans } from "@/backend/plans/plan-service";
import { listPublicPages } from "@/backend/admin/public-pages-service";
import { platformAnalytics } from "@/backend/admin/platform-analytics-service";
import { questionGenerationAdminState } from "@/backend/exams/demo-store";

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
