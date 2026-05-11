import { redirect } from "next/navigation";
import { currentUser } from "@/backend/auth/session";
import { getExam } from "@/backend/exams/exam-service";
import { planHasFeature } from "@/backend/plans/plan-service";
import { ExamEngine } from "@/frontend/features/exams/exam-engine";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/");
  const { id } = await params;
  const exam = getExam(id);
  if (!exam) redirect(user.role === "PARENT" ? "/dashboard/parent" : "/dashboard/student");
  if (user.role === "STUDENT" && exam.studentId !== user.id) redirect("/dashboard/student");
  return <ExamEngine initialExam={exam} externalAiPromptAllowed={planHasFeature(user.subscriptionTier, "EXTERNAL_AI_PROMPT_HELP")} />;
}
