import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { adminListExams } from "@/backend/admin/exam-admin-service";

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({ exams: adminListExams() });
}
