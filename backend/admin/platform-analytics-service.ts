import type { PlatformAnalytics } from "@/backend/shared/types";
import { questionBank } from "@/backend/questions/question-bank";
import { store } from "@/backend/exams/demo-store";

export function platformAnalytics(): PlatformAnalytics {
  const data = store();
  const completed = data.exams.filter((exam) => exam.status === "GRADED");
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, exam) => sum + (exam.score ?? 0), 0) / completed.length)
    : 0;
  return {
    totalUsers: data.users.length,
    students: data.users.filter((user) => user.role === "STUDENT").length,
    parents: data.users.filter((user) => user.role === "PARENT").length,
    admins: data.users.filter((user) => user.role === "ADMIN").length,
    activeSubscriptions: data.users.filter((user) => user.subscriptionTier !== "FOUNDATION").length,
    examsStarted: data.exams.length,
    examsCompleted: completed.length,
    averageScore,
    auditEvents: data.auditLogs.length,
    aiInsightsCached: data.insights.length,
    questionBankSize: questionBank.length,
    uptimeStatus: "OPERATIONAL"
  };
}
