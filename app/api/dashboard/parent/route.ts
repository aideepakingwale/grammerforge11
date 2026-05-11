import { NextResponse } from "next/server";
import { requireUser } from "@/backend/auth/session";
import { dashboardInsights } from "@/backend/ai/insights";
import { buildPerformanceAnalytics } from "@/backend/analytics/performance";
import { examsForStudent, listStudentsFor } from "@/backend/exams/demo-store";

export async function GET() {
  try {
    const user = await requireUser(["PARENT"]);
    const students = listStudentsFor(user.id);
    const student = students[0];
    const exams = student ? examsForStudent(student.id) : [];
    const insight = student ? await dashboardInsights(student, "parent") : null;
    const performance = buildPerformanceAnalytics(exams);
    return NextResponse.json({ user, students, selectedStudent: student, exams, insight, performance });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: error.status === 403 ? "Forbidden" : "Unauthenticated" }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to load parent dashboard." }, { status: 500 });
  }
}
