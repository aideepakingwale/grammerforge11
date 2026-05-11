import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { listPlans } from "@/backend/exams/demo-store";

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({ plans: listPlans() });
}
