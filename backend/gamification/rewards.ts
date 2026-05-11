import type { Exam } from "@/backend/shared/types";

export type Reward = {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpRequired: number;
  accent: "teal" | "gold" | "coral" | "lilac";
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

export const rewards: Reward[] = [
  {
    id: "avatar_crown",
    title: "Crown Avatar Frame",
    description: "A premium frame for your learner profile.",
    icon: "Crown",
    xpRequired: 120,
    accent: "gold"
  },
  {
    id: "focus_theme",
    title: "Focus Theme",
    description: "Unlock a calm exam-room theme.",
    icon: "Palette",
    xpRequired: 240,
    accent: "teal"
  },
  {
    id: "streak_star",
    title: "Streak Star",
    description: "A reward for consistent practice energy.",
    icon: "Star",
    xpRequired: 420,
    accent: "coral"
  },
  {
    id: "mastery_banner",
    title: "Mastery Banner",
    description: "Show off your strongest subject.",
    icon: "Sparkles",
    xpRequired: 700,
    accent: "lilac"
  }
];

export function calculateGamification(exams: Exam[]) {
  const completed = exams.filter((exam) => exam.status === "GRADED");
  const correctAnswers = completed.reduce((sum, exam) => sum + exam.correctAnswers, 0);
  const totalQuestions = completed.reduce((sum, exam) => sum + exam.totalQuestions, 0);
  const average = completed.length
    ? Math.round(completed.reduce((sum, exam) => sum + (exam.score ?? 0), 0) / completed.length)
    : 0;
  const flaggedReviews = completed.reduce(
    (sum, exam) => sum + Object.values(exam.answers).filter((answer) => answer.isMarkedForReview).length,
    0
  );

  const xp = completed.reduce((sum, exam) => {
    const scoreBonus = Math.round((exam.score ?? 0) * 1.5);
    const completionBonus = 50;
    const accuracyBonus = (exam.score ?? 0) >= 85 ? 80 : (exam.score ?? 0) >= 70 ? 35 : 0;
    return sum + scoreBonus + completionBonus + accuracyBonus;
  }, 0);

  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const currentLevelStart = (level - 1) * 250;
  const nextLevelXp = level * 250;
  const levelProgress = Math.min(100, Math.round(((xp - currentLevelStart) / 250) * 100));
  const unlockedRewards = rewards.filter((reward) => xp >= reward.xpRequired);
  const nextReward = rewards.find((reward) => xp < reward.xpRequired) ?? rewards[rewards.length - 1];

  const badges: Badge[] = [
    {
      id: "first_exam",
      title: "First Quest",
      description: "Complete your first exam.",
      icon: "Rocket",
      unlocked: completed.length >= 1,
      progress: Math.min(100, completed.length * 100)
    },
    {
      id: "accuracy_hero",
      title: "Accuracy Hero",
      description: "Reach an 80% average score.",
      icon: "ShieldCheck",
      unlocked: average >= 80,
      progress: Math.min(100, Math.round((average / 80) * 100))
    },
    {
      id: "question_sprinter",
      title: "Question Sprinter",
      description: "Answer 20 questions.",
      icon: "Zap",
      unlocked: totalQuestions >= 20,
      progress: Math.min(100, Math.round((totalQuestions / 20) * 100))
    },
    {
      id: "review_captain",
      title: "Review Captain",
      description: "Use review flags 5 times.",
      icon: "Flag",
      unlocked: flaggedReviews >= 5,
      progress: Math.min(100, Math.round((flaggedReviews / 5) * 100))
    }
  ];

  return {
    xp,
    level,
    currentLevelStart,
    nextLevelXp,
    levelProgress,
    completedCount: completed.length,
    correctAnswers,
    totalQuestions,
    average,
    unlockedRewards,
    nextReward,
    badges
  };
}

export function xpForExam(exam: Exam) {
  if (exam.status !== "GRADED") return 0;
  const scoreBonus = Math.round((exam.score ?? 0) * 1.5);
  const accuracyBonus = (exam.score ?? 0) >= 85 ? 80 : (exam.score ?? 0) >= 70 ? 35 : 0;
  return 50 + scoreBonus + accuracyBonus;
}
