"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type { Subject, SubscriptionPlanConfig } from "@/backend/shared/types";

export function ExamLauncher({
  proctorAllowed = true,
  customAllowed = false,
  plan
}: {
  proctorAllowed?: boolean;
  customAllowed?: boolean;
  plan?: SubscriptionPlanConfig;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>("MATHS");
  const [isProctored, setIsProctored] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [questionCount, setQuestionCount] = useState(40);
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [easy, setEasy] = useState(10);
  const [medium, setMedium] = useState(20);
  const [hard, setHard] = useState(10);
  const [topic, setTopic] = useState("");
  const [subTopics, setSubTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function launch() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/exams/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        isProctored,
        mode: customAllowed && customMode ? "CUSTOM_LLM" : "STANDARD",
        questionCount,
        durationMinutes,
        difficultyMix: { easy, medium, hard },
        topic: customMode && topic.trim() ? topic.trim() : undefined,
        subTopics: customMode
          ? subTopics
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        microTopic: customMode && subTopics.trim() ? subTopics.split(",")[0]?.trim() : undefined
      })
    });
    const json = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(json.error ?? "Unable to create exam");
      return;
    }
    router.push(`/exam/${json.exam.id}`);
  }

  return (
    <div className="premium-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Practice</p>
          <h2 className="mt-1 text-xl font-black">Start an adaptive exam</h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">Pick a subject and launch a timed paper from the hybrid question bank.</p>
        </div>
        <div className="rounded-md bg-teal/10 p-2 text-teal"><BookOpenCheck size={22} /></div>
      </div>
      <div className="mt-4 grid gap-3">
        <select className="field" value={subject} onChange={(event) => setSubject(event.target.value as Subject)}>
          <option value="MATHS">Maths</option>
          <option value="ENGLISH">English</option>
          <option value="VERBAL_REASONING">Verbal Reasoning</option>
          <option value="NON_VERBAL_REASONING">Non-Verbal Reasoning</option>
        </select>
        <Button className="w-full" onClick={launch} disabled={loading}>
          <Play size={18} /> {loading ? "Preparing..." : "Start exam"}
        </Button>
      </div>
      {customAllowed ? (
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-3 text-sm font-bold text-ink/72">
          <span>{plan?.name ?? "Apex"} custom LLM recipe</span>
          <input className="h-4 w-4 accent-teal" type="checkbox" checked={customMode} onChange={(event) => setCustomMode(event.target.checked)} />
        </label>
      ) : (
        <div className="mt-3 rounded-md border border-ink/10 bg-white p-3 text-sm font-semibold text-ink/55">
          Custom LLM recipe is not included in your current plan.
        </div>
      )}
      {customAllowed && customMode && (
        <div className="mt-3 grid gap-2 rounded-md border border-gold/25 bg-gold/10 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="number" min={1} max={plan?.customExamMaxQuestions || 80} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} />
            <input className="field" type="number" min={1} max={plan?.customExamMaxMinutes || 100} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input className="field" type="number" min={0} max={80} value={easy} onChange={(event) => setEasy(Number(event.target.value))} />
            <input className="field" type="number" min={0} max={80} value={medium} onChange={(event) => setMedium(Number(event.target.value))} />
            <input className="field" type="number" min={0} max={80} value={hard} onChange={(event) => setHard(Number(event.target.value))} />
          </div>
          <input
            className="field"
            placeholder="Topic group, e.g. Fractions, Decimals & Percentages"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <input
            className="field"
            placeholder="Sub-topics in proportion, comma separated"
            value={subTopics}
            onChange={(event) => setSubTopics(event.target.value)}
          />
          <p className="text-xs font-bold text-ink/55">
            Questions, minutes, Easy / Medium / Hard mix, then optional topic and sub-topic recipe. Sub-topics are distributed proportionally.
          </p>
        </div>
      )}
      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-3 text-sm font-bold text-ink/72">
        <span className="flex items-center gap-2"><ShieldCheck size={16} /> Secure proctoring</span>
        <input className="h-4 w-4 accent-teal" type="checkbox" checked={isProctored} disabled={!proctorAllowed} onChange={(event) => setIsProctored(event.target.checked)} />
      </label>
      {!proctorAllowed && <p className="mt-2 text-xs font-bold text-ink/50">Secure proctoring is disabled for your current plan.</p>}
      {error && <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">{error}</p>}
    </div>
  );
}
