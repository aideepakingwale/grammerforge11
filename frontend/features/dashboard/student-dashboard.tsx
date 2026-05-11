"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, BookOpenCheck, Crown, Flag, Gift, Palette, Rocket, ShieldCheck, Sparkles, Star, Target, Trophy, Zap } from "lucide-react";
import { ExamLauncher } from "@/frontend/features/exams/exam-launcher";
import { LogoutButton } from "@/frontend/features/navigation/logout-button";
import { calculateGamification } from "@/backend/gamification/rewards";
import type { Exam, Insight, SafeUser } from "@/backend/shared/types";
import { subjectLabel } from "@/backend/shared/utils";

type StudentData = {
  user: SafeUser;
  exams: Exam[];
  insight: Insight;
};

export function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/student")
      .then((response) => {
        if (response.status === 401) location.href = "/";
        return response.json();
      })
      .then(setData);
  }, []);

  const average = useMemo(() => {
    if (!data?.exams.length) return 0;
    return Math.round(data.exams.reduce((sum, exam) => sum + (exam.score ?? 0), 0) / data.exams.length);
  }, [data]);
  const game = useMemo(() => calculateGamification(data?.exams ?? []), [data?.exams]);

  if (!data) return <main className="app-shell p-6">Loading your dashboard...</main>;
  const insight = data.insight.insightContent as { summary?: string; focusAreas?: string[]; plan?: string[] };

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-6">
        <header className="surface mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
          <div>
            <p className="eyebrow">Student mission board</p>
            <h1 className="mt-1 text-3xl font-black">Hi {data.user.firstName}, ready for a smart practice round?</h1>
            <p className="text-ink/65">Small, steady practice turns into real exam confidence.</p>
          </div>
          <LogoutButton />
        </header>

        <div className="grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
          <section className="premium-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-gold/20 p-3 text-gold"><Trophy size={28} /></div>
              <div>
                <h2 className="text-xl font-black">Level {game.level} Learner</h2>
                <p className="text-sm text-ink/65">{game.xp} XP earned from practice</p>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink/55">Next level</p>
                <p className="text-4xl font-black">{game.nextLevelXp - game.xp} XP</p>
              </div>
              <span className="chip"><Target size={14} /> Average {average}%</span>
            </div>
            <div className="mt-5 h-4 rounded-full bg-ink/10">
              <div className="h-4 rounded-full bg-gradient-to-r from-teal via-mint to-gold shadow-sm transition-all" style={{ width: `${game.levelProgress}%` }} />
            </div>
            <p className="mt-2 text-xs font-bold text-ink/50">{game.currentLevelStart} XP - {game.nextLevelXp} XP</p>
          </section>

          <section className="premium-card p-5">
            <div className="flex items-center gap-2 font-black"><Sparkles size={18} /> AI Coach</div>
            <p className="mt-3 text-lg leading-8 text-ink/75">
              {insight?.summary ?? "Start an exam and I will help you choose your next practice step."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(insight?.focusAreas ?? ["Careful reading", "Timed practice", "Review flags"]).map((item) => (
                <span key={item} className="chip bg-skysoft text-teal">{item}</span>
              ))}
            </div>
          </section>
        </div>

        <section className="premium-card mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Reward shop</p>
              <h2 className="mt-1 text-2xl font-black">Unlock rewards by learning</h2>
              <p className="mt-1 text-sm text-ink/60">Complete exams, improve accuracy, and use review flags to earn XP.</p>
            </div>
            <span className="chip bg-gold/10 text-gold"><Gift size={15} /> {game.unlockedRewards.length} unlocked</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              { title: "Crown Avatar Frame", description: "A premium frame for your learner profile.", icon: Crown, xpRequired: 120, accent: "text-gold" },
              { title: "Focus Theme", description: "Unlock a calm exam-room theme.", icon: Palette, xpRequired: 240, accent: "text-teal" },
              { title: "Streak Star", description: "A reward for consistent practice energy.", icon: Star, xpRequired: 420, accent: "text-coral" },
              { title: "Mastery Banner", description: "Show off your strongest subject.", icon: Sparkles, xpRequired: 700, accent: "text-lilac" }
            ].map((reward) => {
              const unlocked = game.xp >= reward.xpRequired;
              const Icon = reward.icon;
              const progress = Math.min(100, Math.round((game.xp / reward.xpRequired) * 100));
              return (
                <div key={reward.title} className={`rounded-md border p-4 shadow-sm ${unlocked ? "border-gold/40 bg-gold/10" : "border-ink/10 bg-white/80"}`}>
                  <div className="flex items-center justify-between">
                    <div className={`rounded-md bg-white p-2 ${reward.accent}`}><Icon size={22} /></div>
                    <span className={unlocked ? "text-xs font-black text-gold" : "text-xs font-black text-ink/45"}>{unlocked ? "Unlocked" : `${reward.xpRequired} XP`}</span>
                  </div>
                  <h3 className="mt-4 font-black">{reward.title}</h3>
                  <p className="mt-1 min-h-10 text-sm leading-5 text-ink/60">{reward.description}</p>
                  <div className="mt-4 h-2 rounded-full bg-ink/10">
                    <div className={`h-2 rounded-full ${unlocked ? "bg-gold" : "bg-teal"}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="premium-card p-5 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 font-black"><Award size={18} /> Badges</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              {game.badges.map((badge) => {
                const icons = { Rocket, ShieldCheck, Zap, Flag };
                const Icon = icons[badge.icon as keyof typeof icons] ?? Award;
                return (
                <div key={badge.id} className={`rounded-md border p-4 shadow-sm ${badge.unlocked ? "border-teal/30 bg-skysoft" : "border-ink/10 bg-white/80"}`}>
                  <Icon className={badge.unlocked ? "text-teal" : "text-ink/35"} size={24} />
                  <h3 className="mt-3 font-black">{badge.title}</h3>
                  <p className="mt-1 min-h-10 text-sm text-ink/60">{badge.description}</p>
                  <div className="mt-3 h-2 rounded-full bg-ink/10">
                    <div className={badge.unlocked ? "h-2 rounded-full bg-teal" : "h-2 rounded-full bg-ink/30"} style={{ width: `${badge.progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-black text-ink/45">{badge.unlocked ? "Unlocked" : `${badge.progress}%`}</p>
                </div>
                );
              })}
            </div>
          </section>
          <ExamLauncher />
        </div>

        <section className="premium-card mt-4 p-5">
          <h2 className="flex items-center gap-2 font-black"><BookOpenCheck size={18} /> Recent Practice</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.exams.length === 0 && <p className="text-ink/65">No exams yet. Start with a quick Maths or English practice.</p>}
            {data.exams.map((exam) => (
              <a key={exam.id} href={`/exam/${exam.id}`} className="rounded-md border border-ink/10 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal">
                <div className="font-black">{subjectLabel(exam.subject)}</div>
                <div className="mt-1 text-sm text-ink/65">{exam.status} - {exam.score ?? 0}% - +{exam.status === "GRADED" ? Math.round((exam.score ?? 0) * 1.5) + 50 : 0} XP</div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
