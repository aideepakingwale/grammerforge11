import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { listPlans } from "@/backend/plans/plan-service";

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({ plans: listPlans() });
}
