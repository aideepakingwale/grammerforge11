"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Copy, Crown, Flag, Gift, Maximize, Send, Sparkles, Timer } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import { xpForExam } from "@/backend/gamification/rewards";
import type { Exam, Question, QuestionPayload, StudentAnswer } from "@/backend/shared/types";
import { subjectLabel } from "@/backend/shared/utils";

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.max(seconds % 60, 0).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function QuestionContent({ payload, className = "" }: { payload: QuestionPayload; className?: string }) {
  if (payload.mode === "svg") {
    return <div className={`option-figure ${className}`} dangerouslySetInnerHTML={{ __html: payload.content }} />;
  }
  return <div className={className}>{payload.content}</div>;
}

function ReviewAnswer({
  label,
  value,
  option
}: {
  label: string;
  value?: string;
  option?: QuestionPayload;
}) {
  if (!value?.trim()) {
    return (
      <p className="mt-2 inline-flex rounded border border-coral/25 bg-coral/10 px-2 py-1 text-sm font-bold text-coral">
        {label}: Not attempted
      </p>
    );
  }

  if (option?.mode === "svg") {
    return (
      <div className="mt-3 rounded border border-ink/15 bg-[#fffdf7] p-3">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-ink/50">{label}</p>
        <QuestionContent payload={option} />
      </div>
    );
  }

  return <p className="mt-2 text-sm">{label}: {value}</p>;
}

const externalAiPlatforms = [
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Gemini", url: "https://gemini.google.com/" },
  { name: "Claude", url: "https://claude.ai/" },
  { name: "Copilot", url: "https://copilot.microsoft.com/" }
];

function payloadForPrompt(payload: QuestionPayload) {
  return payload.mode === "svg" ? `[SVG]\n${payload.content}` : payload.content;
}

function buildExternalAiPrompt(question: Question, answer?: StudentAnswer) {
  const options = question.options.length
    ? question.options
        .map((option, index) => `Option ${String.fromCharCode(65 + index)} (${option.mode.toUpperCase()}):\n${payloadForPrompt(option)}`)
        .join("\n\n")
    : "No multiple-choice options. This is a short-answer question.";

  const stimulus = question.stimulus
    ? `Stimulus (${question.stimulus.mode.toUpperCase()}):\nTitle: ${question.stimulus.title}\n${question.stimulus.content}`
    : "No separate stimulus.";

  return [
    "You are an expert UK 11+ Grammar School tutor.",
    "Please give a detailed explanation and, if SVG/visual content is present, provide deep visual analysis of the shapes, transformations, patterns, and why the correct answer works.",
    "Explain why the student's answer is correct or incorrect, why the correct answer is correct, and why the distractor options are less suitable.",
    "Use child-friendly language but include enough detail for a parent to understand the reasoning.",
    "",
    `Subject: ${question.subjectType.replaceAll("_", " ")}`,
    `Micro-topic: ${question.microTopic}`,
    `Difficulty: ${question.difficultyLevel}`,
    `Question type: ${question.questionType.replaceAll("_", " ")}`,
    "",
    stimulus,
    "",
    `Question (${question.questionData.mode.toUpperCase()}):\n${payloadForPrompt(question.questionData)}`,
    "",
    options,
    "",
    `Student answer:\n${answer?.studentResponse || "No answer submitted"}`,
    "",
    `Correct answer:\n${question.answer}`,
    "",
    `Platform feedback:\n${answer?.aiFeedback || question.explanation}`,
    "",
    "Please format the answer with: 1) short verdict, 2) step-by-step reasoning, 3) visual/SVG analysis if relevant, 4) why each option is right/wrong, 5) one similar practice tip."
  ].join("\n");
}

function ExternalAiPromptTools({ question, answer }: { question: Question; answer?: StudentAnswer }) {
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");

  async function copyPrompt(platformName: string) {
    const prompt = buildExternalAiPrompt(question, answer);
    setCopyError("");
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(platformName);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        setCopied(platformName);
        return true;
      }
      setCopyError("Copy was blocked by the browser. Select and copy the prompt manually from this page after retrying.");
      return false;
    }
  }

  return (
    <div className="mt-4 rounded border border-teal/20 bg-skysoft p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black">Get deeper explanation with your own AI account</p>
          <p className="mt-1 text-xs font-bold text-ink/60">Copies a full prompt with question text/SVG, options, answer, and feedback. This does not use GrammarForge API quota.</p>
        </div>
        {copied && <span className="rounded bg-white px-2 py-1 text-xs font-black text-teal">Copied for {copied}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {externalAiPlatforms.map((platform) => (
          <button
            key={platform.name}
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/10 bg-white px-3 text-sm font-black text-ink shadow-sm transition hover:border-teal hover:text-teal"
            onClick={async () => {
              await copyPrompt(platform.name);
              window.open(platform.url, "_blank", "noopener,noreferrer");
            }}
          >
            <Copy size={15} /> {platform.name}
          </button>
        ))}
      </div>
      {copyError && <p className="mt-2 text-xs font-bold text-coral">{copyError}</p>}
    </div>
  );
}

export function ExamEngine({ initialExam, externalAiPromptAllowed = false }: { initialExam: Exam; externalAiPromptAllowed?: boolean }) {
  const router = useRouter();
  const [exam, setExam] = useState(initialExam);
  const [index, setIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, { studentResponse: string; isMarkedForReview: boolean }>>({});
  const [saveError, setSaveError] = useState("");
  const [remaining, setRemaining] = useState(() => {
    if (!initialExam.serverExpiresAt) return initialExam.durationSeconds;
    return Math.max(0, Math.floor((new Date(initialExam.serverExpiresAt).getTime() - Date.now()) / 1000));
  });

  const active = exam.questions[index];
  const currentAnswer = exam.answers[active.question.id];
  const currentDraft = draftAnswers[active.question.id];
  const response = currentDraft?.studentResponse ?? currentAnswer?.studentResponse ?? "";
  const flagged = currentDraft?.isMarkedForReview ?? currentAnswer?.isMarkedForReview ?? false;

  function updateDraft(questionId: string, nextResponse: string, nextFlagged: boolean) {
    setDraftAnswers((value) => ({
      ...value,
      [questionId]: {
        studentResponse: nextResponse,
        isMarkedForReview: nextFlagged
      }
    }));
  }

  function setResponse(nextResponse: string) {
    updateDraft(active.question.id, nextResponse, flagged);
  }

  useEffect(() => {
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (remaining === 0 && exam.status === "IN_PROGRESS") void submit();
    // submit intentionally reads the latest draft state when the countdown expires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    const log = (eventType: string, details?: unknown) => {
      if (!exam.isProctored) return;
      void fetch(`/api/exams/${exam.id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, details })
      });
    };

    const blur = () => log("WINDOW_BLUR");
    const focus = () => log("WINDOW_FOCUS");
    const fullscreen = () => log(document.fullscreenElement ? "FULLSCREEN_ENTER" : "FULLSCREEN_EXIT");
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") {
        event.preventDefault();
        log("PRINT_SCREEN_ATTEMPT");
      }
    };

    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("fullscreenchange", fullscreen);
    document.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("fullscreenchange", fullscreen);
      document.removeEventListener("keydown", keydown);
    };
  }, [exam.id, exam.isProctored]);

  function updateAnswerLocally(questionId: string, nextResponse: string, nextFlagged: boolean) {
    updateDraft(questionId, nextResponse, nextFlagged);
    setExam((value) => ({
      ...value,
      answers: {
        ...value.answers,
        [questionId]: {
          id: value.answers[questionId]?.id ?? `pending_${questionId}`,
          examId: exam.id,
          questionId,
          studentResponse: nextResponse,
          isMarkedForReview: nextFlagged,
          submittedAt: new Date().toISOString()
        }
      }
    }));
  }

  async function persistAnswer(questionId: string, nextResponse: string, nextFlagged: boolean) {
    updateAnswerLocally(questionId, nextResponse, nextFlagged);
    setSaveError("");
    try {
      const res = await fetch(`/api/exams/${exam.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, studentResponse: nextResponse, isMarkedForReview: nextFlagged })
      });
      if (!res.ok) {
        setSaveError("Your answer is kept on screen, but it could not be saved yet. Please try again before submitting.");
        return false;
      }
      const json = await res.json();
      setExam((value) => ({
        ...value,
        answers: { ...value.answers, [questionId]: json.answer }
      }));
      return true;
    } catch {
      setSaveError("Your answer is kept on screen, but it could not be saved yet. Please check the connection.");
      return false;
    }
  }

  async function save(nextIndex?: number, overrides?: { studentResponse?: string; isMarkedForReview?: boolean }) {
    const questionId = active.question.id;
    const nextResponse = overrides?.studentResponse ?? response;
    const nextFlagged = overrides?.isMarkedForReview ?? flagged;
    const ok = await persistAnswer(questionId, nextResponse, nextFlagged);
    if (typeof nextIndex === "number") setIndex(nextIndex);
    return ok;
  }

  function navigateTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= exam.questions.length || nextIndex === index) return;
    const questionId = active.question.id;
    const nextResponse = response;
    const nextFlagged = flagged;
    updateAnswerLocally(questionId, nextResponse, nextFlagged);
    setIndex(nextIndex);
    void persistAnswer(questionId, nextResponse, nextFlagged);
  }

  async function toggleReviewFlag() {
    const nextFlagged = !flagged;
    updateAnswerLocally(active.question.id, response, nextFlagged);
    void persistAnswer(active.question.id, response, nextFlagged);
  }

  async function submit() {
    await save();
    const res = await fetch(`/api/exams/${exam.id}/submit`, { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      setExam(json.exam);
    }
  }

  const answeredCount = useMemo(() => Object.values(exam.answers).filter((answer) => answer.studentResponse).length, [exam.answers]);
  const progressPercent = Math.round((answeredCount / Math.max(exam.totalQuestions, 1)) * 100);

  if (exam.status === "GRADED") {
    const earnedXp = xpForExam(exam);
    const unlockedReward = earnedXp >= 170 || (exam.score ?? 0) >= 85;
    return (
      <main className="min-h-screen bg-[#eef2ef] px-5 py-6">
        <section className="exam-paper mx-auto max-w-5xl rounded-md p-6">
          <div className="exam-rule py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/55">Marked paper</p>
            <h1 className="mt-1 text-3xl font-black">Exam Complete</h1>
            <p className="mt-2 text-ink/65">Score: <strong>{exam.score}%</strong> - Correct: {exam.correctAnswers}/{exam.totalQuestions}</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-teal/20 bg-skysoft p-4">
              <Sparkles className="text-teal" size={24} />
              <p className="mt-3 text-3xl font-black">+{earnedXp}</p>
              <p className="text-sm font-bold text-ink/60">XP earned</p>
            </div>
            <div className="rounded-md border border-gold/30 bg-gold/10 p-4">
              <Crown className="text-gold" size={24} />
              <p className="mt-3 text-3xl font-black">{exam.score ?? 0}%</p>
              <p className="text-sm font-bold text-ink/60">accuracy reward</p>
            </div>
            <div className={`rounded-md border p-4 ${unlockedReward ? "border-coral/30 bg-coral/10" : "border-ink/10 bg-white/80"}`}>
              <Gift className={unlockedReward ? "text-coral" : "text-ink/35"} size={24} />
              <p className="mt-3 text-lg font-black">{unlockedReward ? "Reward unlocked" : "Keep collecting"}</p>
              <p className="text-sm font-bold text-ink/60">{unlockedReward ? "New badge progress added" : "More XP unlocks the next reward"}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {exam.questions.map((item) => {
              const answer = exam.answers[item.question.id];
              const selectedOption = item.question.options.find((option) => option.content === answer?.studentResponse);
              const correctOption = item.question.options.find((option) => option.content === item.question.answer);
              const isVisualQuestion = item.question.options.some((option) => option.mode === "svg");
              return (
                <div key={item.question.id} className="rounded border border-ink/20 bg-white p-4">
                  <div className="font-black">{item.sequenceOrder}. <QuestionContent payload={item.question.questionData} /></div>
                  {item.question.stimulus && (
                    <p className="mt-1 text-xs font-bold uppercase text-teal">{item.question.stimulus.title}</p>
                  )}
                  <ReviewAnswer label="Your answer" value={answer?.studentResponse} option={selectedOption} />
                  {isVisualQuestion && !answer?.isCorrect && correctOption && (
                    <ReviewAnswer label="Correct figure" value={item.question.answer} option={correctOption} />
                  )}
                  <p className={answer?.isCorrect ? "mt-1 text-sm font-bold text-teal" : "mt-1 text-sm font-bold text-coral"}>
                    {answer?.isCorrect ? "Correct" : "Needs review"}
                  </p>
                  <div className={isVisualQuestion ? "mt-3 rounded border-l-4 border-ink bg-[#f8f8f4] p-3 text-sm leading-6 text-ink/75" : "mt-1 text-sm text-ink/65"}>
                    <span className="font-black">{isVisualQuestion ? "Analysis: " : ""}</span>{answer?.aiFeedback}
                  </div>
                  {externalAiPromptAllowed && <ExternalAiPromptTools question={item.question} answer={answer} />}
                </div>
              );
            })}
          </div>
          <Button className="mt-5" onClick={() => router.push("/dashboard/student")}>Back to dashboard</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="proctor-shield min-h-screen bg-[#eef2ef] px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-3 z-10 mb-4 rounded-md border border-ink/15 bg-white shadow-lg">
          <div className="grid gap-3 border-b border-ink/15 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-teal">
                <span>GrammarForge 11+ Mock Examination</span>
                <span className="text-ink/30">/</span>
                <span>{subjectLabel(exam.subject)}</span>
              </div>
              <h1 className="mt-1 text-2xl font-black">Question Paper and Answer Sheet</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {exam.isProctored && (
                <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-bold shadow-sm" onClick={() => document.documentElement.requestFullscreen()}>
                  <Maximize size={16} /> Fullscreen
                </button>
              )}
              <span className="inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-4 py-2 font-black text-white shadow-sm"><Timer size={18} /> {formatTime(remaining)}</span>
            </div>
          </div>
          <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-4">
            <div><span className="font-black">Candidate:</span> Devansh Ingwale</div>
            <div><span className="font-black">Paper:</span> {subjectLabel(exam.subject)}</div>
            <div><span className="font-black">Questions:</span> {exam.totalQuestions}</div>
            <div><span className="font-black">Answered:</span> {answeredCount}/{exam.totalQuestions}</div>
          </div>
          <div className="h-1 bg-ink/10">
            <div className="h-1 bg-teal transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </header>

        {exam.isProctored && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm font-semibold text-ink/75">
            <AlertTriangle size={18} /> Proctoring is active: focus changes, fullscreen exits, and screenshot attempts are logged.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="exam-paper rounded-md p-5 md:p-8">
            <div className="exam-rule mb-6 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/55">Section A</p>
                  <h2 className="text-xl font-black">{subjectLabel(exam.subject)} Practice Paper</h2>
                </div>
                <div className="text-right text-sm">
                  <p><span className="font-black">Question</span> {index + 1} of {exam.totalQuestions}</p>
                  <p><span className="font-black">Marks</span> 1</p>
                </div>
              </div>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded border border-ink/20 bg-white px-2.5 py-1 text-xs font-black uppercase tracking-wide">{active.question.microTopic}</span>
              {active.question.estimatedSeconds && <span className="rounded border border-ink/20 bg-white px-2.5 py-1 text-xs font-black uppercase tracking-wide">Suggested time {active.question.estimatedSeconds}s</span>}
            </div>

            <div className={active.question.stimulus ? "grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" : "grid gap-5"}>
              {active.question.stimulus && (
                <aside className="rounded border border-ink/25 bg-white p-4 xl:max-h-[620px] xl:overflow-y-auto">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/55">{active.question.stimulus.mode === "passage" ? "Reading passage" : "Question stimulus"}</p>
                  <h2 className="mt-1 border-b border-ink/15 pb-2 text-xl font-black">{active.question.stimulus.title}</h2>
                  {active.question.stimulus.mode === "svg" ? (
                    <div className="stimulus-figure mt-4 rounded border border-ink/10 bg-[#f7f8f6] p-4" dangerouslySetInnerHTML={{ __html: active.question.stimulus.content }} />
                  ) : (
                    <div className="passage-text mt-4 whitespace-pre-line rounded border border-ink/10 bg-[#fffdf7] p-4 text-base text-ink/85">
                      {active.question.stimulus.content}
                    </div>
                  )}
                  {active.question.stimulus.caption && <p className="mt-3 text-sm font-semibold text-ink/55">{active.question.stimulus.caption}</p>}
                </aside>
              )}

              <div>
                {active.question.instruction && (
                  <div className="mb-4 rounded border-l-4 border-ink bg-[#f8f8f4] p-3 text-sm font-bold text-ink">
                    {active.question.instruction}
                  </div>
                )}
                <h2 className="mb-5 text-xl font-black leading-8 md:text-2xl">
                  <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-white">{index + 1}</span>
                  <QuestionContent payload={active.question.questionData} />
                </h2>

                {active.question.questionType === "MULTIPLE_CHOICE" ? (
                  <div className="grid gap-3">
                    {active.question.options.map((option, optionIndex) => (
                      <label key={option.content} className={`flex cursor-pointer items-start gap-3 rounded border p-3 text-sm font-bold transition ${response === option.content ? "border-ink bg-[#f1f7f6]" : "border-ink/20 bg-white hover:border-ink"}`}>
                        <input className="sr-only" type="radio" name="answer" checked={response === option.content} onChange={() => setResponse(option.content)} />
                        <span className="flex gap-3">
                          <span className={`answer-bubble shrink-0 ${response === option.content ? "border-ink bg-ink text-white" : "bg-white text-ink"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                          <QuestionContent payload={option} />
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea className="field min-h-40" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Type your answer here" />
                )}
                {!!active.question.skillTags?.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {active.question.skillTags.map((tag) => <span key={tag} className="rounded border border-ink/15 bg-white px-2.5 py-1 text-xs font-bold text-ink/60">{tag}</span>)}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/20 pt-4">
              <button className={`inline-flex min-h-10 items-center gap-2 rounded border px-3 py-2 text-sm font-bold shadow-sm transition ${flagged ? "border-gold bg-gold/20 text-ink" : "border-ink/20 bg-white hover:border-gold"}`} onClick={toggleReviewFlag}>
                <Flag size={16} className={flagged ? "fill-gold text-gold" : ""} /> {flagged ? "Marked for review" : "Mark for review"}
              </button>
              <div className="flex gap-2">
                <Button className="bg-moss" disabled={index === 0} onClick={() => navigateTo(index - 1)}><ChevronLeft size={18} /> Previous</Button>
                {index < exam.questions.length - 1 ? (
                  <Button onClick={() => navigateTo(index + 1)}>Next <ChevronRight size={18} /></Button>
                ) : (
                  <Button className="bg-coral hover:bg-[#bd543f]" onClick={submit}><Send size={18} /> Submit</Button>
                )}
              </div>
            </div>
            {saveError && <p className="mt-3 rounded border border-coral/30 bg-coral/10 p-3 text-sm font-bold text-coral">{saveError}</p>}
          </section>

          <aside className="sticky top-40 h-fit rounded-md border border-ink/20 bg-[#fffefb] p-4 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/55">Answer sheet</p>
            <h2 className="mb-3 mt-1 font-black">Question Navigator</h2>
            <div className="grid grid-cols-5 gap-2 border-y border-ink/15 py-3">
              {exam.questions.map((item, itemIndex) => {
                const answer = item.question.id === active.question.id ? { studentResponse: response, isMarkedForReview: flagged } : exam.answers[item.question.id];
                return (
                  <button
                    key={item.question.id}
                    title={answer?.isMarkedForReview ? `Question ${itemIndex + 1} marked for review` : `Question ${itemIndex + 1}`}
                    className={`relative h-11 rounded border text-sm font-black transition hover:-translate-y-0.5 ${itemIndex === index && answer?.isMarkedForReview ? "border-gold bg-ink text-white shadow-sm ring-2 ring-gold/45" : itemIndex === index ? "border-ink bg-ink text-white shadow-sm" : answer?.isMarkedForReview ? "border-gold bg-gold/20 text-ink" : answer?.studentResponse ? "border-teal bg-teal text-white" : "border-ink/20 bg-white text-ink/60"}`}
                    onClick={() => navigateTo(itemIndex)}
                  >
                    {answer?.studentResponse && !answer?.isMarkedForReview ? <Check size={16} className="mx-auto" /> : itemIndex + 1}
                    {answer?.isMarkedForReview && <Flag size={10} className="absolute -right-1 -top-1 fill-gold text-gold" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6 text-ink/65">
              <p><strong className="text-teal">Filled</strong> answered</p>
              <p><strong className="text-gold">Tinted</strong> marked for review</p>
              <p><strong>Autosave</strong> runs when you move between questions.</p>
            </div>
            <div className="mt-4 rounded border border-ink/15 bg-[#f8f8f4] p-3 text-xs font-bold leading-5 text-ink/65">
              Read each question carefully. You may return to any question before submitting the paper.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
