"use client";

import { useState } from "react";
import { BookOpen, CalendarClock, Save, Wand2 } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import { syllabusRegistry } from "@/backend/syllabus/registry";
import type {
  Difficulty,
  LlmGenerationMeta,
  PlatformConfig,
  QuestionBankStats,
  QuestionCandidate,
  QuestionGenerationJob,
  QuestionGenerationSchedule,
  QuestionType,
  Subject
} from "@/backend/shared/types";

type Mutate = (url: string, options: RequestInit, success: string) => Promise<void>;

type Props = {
  initial?: {
    stats: QuestionBankStats;
    llmQuota: PlatformConfig["llmQuota"];
    schedule: QuestionGenerationSchedule;
    jobs: QuestionGenerationJob[];
  };
  mutate: Mutate;
};

export function QuestionsPanel({ initial, mutate }: Props) {
  const [subject, setSubject] = useState<Subject>("MATHS");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([syllabusRegistry.MATHS[0].name]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(["MEDIUM"]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(["MULTIPLE_CHOICE"]);
  const [count, setCount] = useState(10);
  const [provider, setProvider] = useState<"GEMINI" | "GROQ" | "INTERNAL">("GEMINI");
  const [prompt, setPrompt] = useState("");
  const [candidates, setCandidates] = useState<QuestionCandidate[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [generationMeta, setGenerationMeta] = useState<LlmGenerationMeta | null>(null);
  const [working, setWorking] = useState("");
  const [localError, setLocalError] = useState("");

  const fallback: QuestionGenerationSchedule = {
    enabled: false,
    subject: "MATHS",
    difficulty: "MEDIUM",
    questionType: "MULTIPLE_CHOICE",
    count: 10,
    microTopic: "Mixed 11+ Practice",
    provider: "GEMINI",
    frequency: "DAILY",
    runAt: "02:00",
    updatedAt: new Date().toISOString()
  };
  const stats = initial?.stats;
  const llmQuota = initial?.llmQuota ?? [];
  const schedule = initial?.schedule ?? fallback;
  const jobs = initial?.jobs ?? [];
  const topics = syllabusRegistry[subject];
  const selectedTopicGroups = topics.filter((item) => selectedTopics.includes(item.name));
  const visibleSubTopics = Array.from(new Set((selectedTopicGroups.length ? selectedTopicGroups : topics).flatMap((item) => item.subTopics)));
  const fallbackTopic = selectedTopicGroups[0] ?? topics[0];

  const generationPayload = {
    subject,
    difficulty: selectedDifficulties[0] ?? "MEDIUM",
    questionType: selectedQuestionTypes[0] ?? "MULTIPLE_CHOICE",
    count,
    microTopic: selectedSubTopics[0] ?? fallbackTopic?.subTopics[0] ?? fallbackTopic?.name ?? "Mixed 11+ Practice",
    topic: fallbackTopic?.name,
    topics: selectedTopics.length ? selectedTopics : topics.map((item) => item.name),
    subTopics: selectedSubTopics.length ? selectedSubTopics : visibleSubTopics.slice(0, Math.min(4, visibleSubTopics.length)),
    difficulties: selectedDifficulties,
    questionTypes: selectedQuestionTypes,
    provider
  };

  function changeSubject(nextSubject: Subject) {
    const firstTopic = syllabusRegistry[nextSubject][0];
    setSubject(nextSubject);
    setSelectedTopics([firstTopic.name]);
    setSelectedSubTopics([]);
    setPrompt("");
    setCandidates([]);
    setSelectedQuestionIds([]);
    setGenerationMeta(null);
  }

  function toggleListValue<T extends string>(value: T, setter: (updater: (current: T[]) => T[]) => void) {
    setter((current) => {
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return next.length ? next : [value];
    });
  }

  async function previewPrompt() {
    setWorking("preview");
    setLocalError("");
    const response = await fetch("/api/admin/questions/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generationPayload)
    });
    const json = await response.json();
    setWorking("");
    if (!response.ok) return setLocalError(json.error ?? "Could not preview prompt");
    setPrompt(json.prompt);
  }

  async function generateCandidates() {
    setWorking("generate");
    setLocalError("");
    const response = await fetch("/api/admin/questions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...generationPayload, promptOverride: prompt || undefined })
    });
    const json = await response.json();
    setWorking("");
    if (!response.ok) return setLocalError(json.error ?? "Could not generate questions");
    setPrompt(json.prompt);
    setCandidates(json.questions ?? []);
    setSelectedQuestionIds((json.questions ?? []).filter((question: QuestionCandidate) => question.uniqueness?.isUnique).map((question: QuestionCandidate) => question.id));
    setGenerationMeta(json.generationMeta ?? null);
  }

  async function importSelected() {
    const questions = candidates.filter((question) => question.uniqueness?.isUnique && selectedQuestionIds.includes(question.id));
    if (!questions.length) return setLocalError("Select at least one generated question to import.");
    setWorking("import");
    setLocalError("");
    await mutate("/api/admin/questions/import", { method: "POST", body: JSON.stringify({ questions }) }, `${questions.length} question(s) imported`);
    setWorking("");
    setCandidates([]);
    setSelectedQuestionIds([]);
    setGenerationMeta(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <GuidedControls
          subject={subject}
          selectedTopics={selectedTopics}
          selectedSubTopics={selectedSubTopics}
          selectedDifficulties={selectedDifficulties}
          selectedQuestionTypes={selectedQuestionTypes}
          count={count}
          provider={provider}
          topics={topics}
          visibleSubTopics={visibleSubTopics}
          working={working}
          onSubjectChange={changeSubject}
          onTopicToggle={(value) => {
            setSelectedTopics((current) => {
              const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
              return next.length ? next : [value];
            });
            setSelectedSubTopics([]);
          }}
          onSubTopicToggle={(value) => setSelectedSubTopics((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}
          onDifficultyToggle={(value) => toggleListValue(value, setSelectedDifficulties)}
          onQuestionTypeToggle={(value) => toggleListValue(value, setSelectedQuestionTypes)}
          onCountChange={setCount}
          onProviderChange={setProvider}
          onPreview={() => void previewPrompt()}
        />
        <ScheduleForm schedule={schedule} mutate={mutate} />
      </div>

      <div className="space-y-4">
        <PromptApproval prompt={prompt} setPrompt={setPrompt} working={working} generateCandidates={generateCandidates} localError={localError} />
        {candidates.length > 0 && (
          <GeneratedReview
            candidates={candidates}
            selectedQuestionIds={selectedQuestionIds}
            generationMeta={generationMeta}
            toggleQuestion={(questionId) => setSelectedQuestionIds((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId])}
            importSelected={importSelected}
            working={working}
          />
        )}
        <QuestionBankStatus stats={stats} schedule={schedule} llmQuota={llmQuota} />
        <GenerationJobs jobs={jobs} />
      </div>
    </div>
  );
}

function GuidedControls(props: {
  subject: Subject;
  selectedTopics: string[];
  selectedSubTopics: string[];
  selectedDifficulties: Difficulty[];
  selectedQuestionTypes: QuestionType[];
  count: number;
  provider: "GEMINI" | "GROQ" | "INTERNAL";
  topics: Array<{ slug: string; name: string }>;
  visibleSubTopics: string[];
  working: string;
  onSubjectChange: (value: Subject) => void;
  onTopicToggle: (value: string) => void;
  onSubTopicToggle: (value: string) => void;
  onDifficultyToggle: (value: Difficulty) => void;
  onQuestionTypeToggle: (value: QuestionType) => void;
  onCountChange: (value: number) => void;
  onProviderChange: (value: "GEMINI" | "GROQ" | "INTERNAL") => void;
  onPreview: () => void;
}) {
  return (
    <div className="premium-card p-4">
      <div className="flex items-center gap-2"><Wand2 className="text-teal" size={22} /><h2 className="text-xl font-black">Guided question generation</h2></div>
      <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">Select syllabus coverage, preview the prompt, then import only approved questions.</p>
      <div className="mt-4 grid gap-3">
        <select className="field" value={props.subject} onChange={(event) => props.onSubjectChange(event.target.value as Subject)}>
          <option value="MATHS">Maths</option><option value="ENGLISH">English</option><option value="VERBAL_REASONING">Verbal Reasoning</option><option value="NON_VERBAL_REASONING">Non-Verbal Reasoning</option>
        </select>
        <MultiSelect title="Topics, multi-select allowed" values={props.topics.map((item) => item.name)} selected={props.selectedTopics} onToggle={props.onTopicToggle} />
        <MultiSelect title="Subtopics from selected topics" values={props.visibleSubTopics} selected={props.selectedSubTopics} onToggle={props.onSubTopicToggle} />
        <div className="grid gap-3 md:grid-cols-2">
          <MultiSelect title="Difficulty mix" values={["EASY", "MEDIUM", "HARD", "ADVANCED"] as Difficulty[]} selected={props.selectedDifficulties} onToggle={props.onDifficultyToggle} />
          <MultiSelect title="Question type mix" values={["MULTIPLE_CHOICE", "SHORT_ANSWER"] as QuestionType[]} selected={props.selectedQuestionTypes} onToggle={props.onQuestionTypeToggle} format={formatEnumLabel} />
        </div>
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <select className="field" value={props.provider} onChange={(event) => props.onProviderChange(event.target.value as "GEMINI" | "GROQ" | "INTERNAL")}>
            <option value="GEMINI">Gemini</option><option value="GROQ">Groq</option><option value="INTERNAL">Internal fallback</option>
          </select>
          <input className="field" type="number" min={1} max={100} value={props.count} onChange={(event) => props.onCountChange(Number(event.target.value))} />
        </div>
        <Button type="button" className="w-full" onClick={props.onPreview} disabled={props.working === "preview"}><BookOpen size={16} /> {props.working === "preview" ? "Preparing prompt..." : "Preview generation prompt"}</Button>
      </div>
    </div>
  );
}

function MultiSelect<T extends string>({ title, values, selected, onToggle, format = (value: T) => value }: { title: string; values: T[]; selected: T[]; onToggle: (value: T) => void; format?: (value: T) => string }) {
  return (
    <div className="max-h-52 overflow-y-auto rounded-md border border-ink/10 bg-white p-2">
      <p className="mb-2 text-xs font-black uppercase text-ink/45">{title}</p>
      <div className="grid gap-2">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-md bg-paper px-3 py-2 text-sm font-bold">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /> {format(value)}
          </label>
        ))}
      </div>
    </div>
  );
}

function PromptApproval({ prompt, setPrompt, working, generateCandidates, localError }: { prompt: string; setPrompt: (value: string) => void; working: string; generateCandidates: () => Promise<void>; localError: string }) {
  return (
    <div className="premium-card p-4">
      <h2 className="text-xl font-black">Prompt approval</h2>
      <textarea className="field mt-3 min-h-80 font-mono text-xs leading-5" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Click Preview generation prompt to build the prompt." />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void generateCandidates()} disabled={!prompt || working === "generate"}><Wand2 size={16} /> {working === "generate" ? "Generating..." : "Generate candidates"}</Button>
        <button type="button" className="inline-flex min-h-11 items-center rounded-md border border-ink/10 px-4 text-sm font-black" onClick={() => setPrompt("")}>Clear prompt</button>
      </div>
      {localError && <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">{localError}</p>}
    </div>
  );
}

function GeneratedReview({ candidates, selectedQuestionIds, generationMeta, toggleQuestion, importSelected, working }: { candidates: QuestionCandidate[]; selectedQuestionIds: string[]; generationMeta: LlmGenerationMeta | null; toggleQuestion: (id: string) => void; importSelected: () => Promise<void>; working: string }) {
  const uniqueCount = candidates.filter((question) => question.uniqueness?.isUnique).length;
  return (
    <div className="premium-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-black">Generated question review</h2><p className="mt-1 text-sm font-semibold text-ink/55">{uniqueCount} unique candidate(s) can be imported. Duplicates are shown for audit but locked.</p></div>
        <Button type="button" onClick={() => void importSelected()} disabled={working === "import"}><Save size={16} /> Import selected ({selectedQuestionIds.length})</Button>
      </div>
      {generationMeta && <GenerationMetaPanel meta={generationMeta} />}
      <div className="mt-4 space-y-3">
        {candidates.map((question, index) => {
          const isUnique = question.uniqueness?.isUnique ?? true;
          return (
          <div key={question.id} className={`rounded-md border p-4 ${isUnique ? "border-moss/30 bg-white" : "border-coral/25 bg-coral/5"}`}>
            <label className="flex items-start gap-3">
              <input className="mt-1 h-5 w-5 accent-teal disabled:cursor-not-allowed disabled:opacity-40" type="checkbox" disabled={!isUnique} checked={isUnique && selectedQuestionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} />
              <span className="flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-black">Question {index + 1}: {question.topic} / {question.microTopic}</span>
                  <UniquenessBadge uniqueness={question.uniqueness} />
                </span>
                <span className="mt-1 block text-sm font-semibold text-ink/60">{question.instruction}</span>
                {!isUnique && <span className="mt-2 block rounded-md bg-coral/10 p-2 text-xs font-bold text-coral">Rejected from import: {question.uniqueness?.reason ?? "Duplicate question"}</span>}
              </span>
            </label>
            {question.stimulus && <div className="mt-3 rounded-md bg-paper p-3"><p className="text-xs font-black uppercase text-ink/45">{question.stimulus.title}</p><QuestionVisual payload={question.stimulus} /></div>}
            <div className="mt-3 font-semibold"><QuestionVisual payload={question.questionData} /></div>
            {question.options.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">{question.options.map((option, optionIndex) => <div key={`${question.id}-${optionIndex}`} className="rounded-md border border-ink/10 bg-paper p-2 text-sm font-semibold"><span className="mb-2 block text-xs font-black text-ink/45">Option {String.fromCharCode(65 + optionIndex)}</span><QuestionVisual payload={option} /></div>)}</div>}
            <div className="mt-3 rounded-md bg-teal/10 p-3 text-sm">
              <div className="font-black text-teal">Answer: <AnswerVisual answer={question.answer} /></div>
              <p className="mt-1 leading-6 text-ink/70">{question.explanation}</p>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function UniquenessBadge({ uniqueness }: { uniqueness?: QuestionCandidate["uniqueness"] }) {
  if (!uniqueness || uniqueness.isUnique) {
    return <span className="rounded-full bg-moss/10 px-2.5 py-1 text-xs font-black uppercase text-moss">Unique</span>;
  }
  return <span className="rounded-full bg-coral/10 px-2.5 py-1 text-xs font-black uppercase text-coral">Duplicate</span>;
}

function QuestionVisual({ payload }: { payload: { mode: string; content: string; caption?: string } }) {
  const content = String(payload.content ?? "");
  if (payload.mode === "svg" && content.trim().startsWith("<svg")) {
    return (
      <figure>
        <div className="option-figure rounded-md border border-ink/10 bg-white p-3" dangerouslySetInnerHTML={{ __html: content }} />
        {payload.caption && <figcaption className="mt-2 text-xs font-semibold text-ink/50">{payload.caption}</figcaption>}
      </figure>
    );
  }
  if (payload.mode === "table") {
    return <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/10 bg-white p-3 text-xs leading-5">{content}</pre>;
  }
  return <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>;
}

function AnswerVisual({ answer }: { answer: string }) {
  const content = String(answer ?? "");
  if (content.trim().startsWith("<svg")) {
    return <span className="mt-2 block max-w-xs"><QuestionVisual payload={{ mode: "svg", content }} /></span>;
  }
  return <span>{content}</span>;
}

function GenerationMetaPanel({ meta }: { meta: LlmGenerationMeta }) {
  return (
    <div className="mt-4 grid gap-3 rounded-md border border-teal/20 bg-teal/10 p-3 md:grid-cols-4">
      <div><p className="text-xs font-black uppercase text-teal">Provider</p><p className="mt-1 font-black">{formatEnumLabel(meta.actualProvider)}</p><p className="text-xs font-semibold text-ink/55">{formatEnumLabel(meta.source)}</p></div>
      <div><p className="text-xs font-black uppercase text-teal">Questions</p><p className="mt-1 font-black">{meta.requestedCount} requested</p><p className="text-xs font-semibold text-ink/55">{meta.llmReturnedCount} LLM, {meta.fallbackCount} fallback</p></div>
      {meta.groq && <><div><p className="text-xs font-black uppercase text-teal">Groq requests</p><p className="mt-1 font-black">{meta.groq.remainingRequests ?? "-"} remaining</p><p className="text-xs font-semibold text-ink/55">limit {meta.groq.limitRequests ?? "-"}, reset {meta.groq.resetRequests ?? "-"}</p></div><div><p className="text-xs font-black uppercase text-teal">Groq tokens</p><p className="mt-1 font-black">{meta.groq.remainingTokens ?? "-"} remaining</p><p className="text-xs font-semibold text-ink/55">limit {meta.groq.limitTokens ?? "-"}, reset {meta.groq.resetTokens ?? "-"}</p></div></>}
      {meta.gemini && <><div><p className="text-xs font-black uppercase text-teal">Gemini tokens</p><p className="mt-1 font-black">{meta.gemini.totalTokenCount ?? "-"} used</p><p className="text-xs font-semibold text-ink/55">prompt {meta.gemini.promptTokenCount ?? "-"}, answer {meta.gemini.candidatesTokenCount ?? "-"}</p></div><div><p className="text-xs font-black uppercase text-teal">Gemini quota</p><p className="mt-1 font-black">Tracked app-side</p><p className="text-xs font-semibold text-ink/55">Exact remaining quota is checked in Google AI Studio.</p></div></>}
      {Boolean(meta.batches?.length) && <div className="md:col-span-4 rounded-md border border-teal/20 bg-white p-3"><p className="text-sm font-black text-ink">Batch generation</p><div className="mt-2 grid gap-2 md:grid-cols-5">{meta.batches?.map((batch) => <div key={batch.index} className="rounded-md bg-paper p-2 text-xs font-bold text-ink/65">Batch {batch.index}: {batch.uniqueCount}/{batch.requestedCount} unique <span className="block text-ink/45">{batch.returnedCount} returned, {batch.duplicateCount} duplicate, {batch.attempts ?? 1} attempt(s)</span></div>)}</div></div>}
      {meta.llmReturnedCount < meta.requestedCount && meta.source === "LLM" && <div className="md:col-span-4 rounded-md border border-gold/30 bg-gold/10 p-3"><p className="text-sm font-black text-ink">LLM returned {meta.llmReturnedCount} of {meta.requestedCount} requested questions.</p><p className="mt-1 text-xs font-semibold text-ink/60">No fallback placeholders were added for admin import. Generate a smaller batch or retry after quota reset.</p></div>}
      {Boolean(meta.duplicateRejectedCount) && <div className="md:col-span-4 rounded-md border border-coral/20 bg-coral/10 p-3"><p className="text-sm font-black text-coral">{meta.duplicateRejectedCount} duplicate candidate(s) removed before review.</p><p className="mt-1 text-xs font-semibold text-ink/60">The uniqueness filter checks this batch, the starter question bank, and the database question master.</p></div>}
    </div>
  );
}

function QuestionBankStatus({ stats, schedule, llmQuota }: { stats?: QuestionBankStats; schedule: QuestionGenerationSchedule; llmQuota: PlatformConfig["llmQuota"] }) {
  return (
    <>
      <div className="premium-card p-4">
        <h2 className="text-xl font-black">Question bank status</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Total questions" value={stats?.total ?? 0} />
          <Metric label="LLM generated" value={stats?.llmGenerated ?? 0} />
          <Metric label="Next scheduled run" value={schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "-"} />
        </div>
      </div>
      <div className="premium-card p-4">
        <h2 className="text-xl font-black">LLM quota status</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {llmQuota.map((quota) => <Metric key={quota.provider} label={`${quota.provider} remaining`} value={quota.remainingToday === null ? "∞" : quota.remainingToday} sub={`Used ${quota.usedToday}`} />)}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <div className="rounded-md bg-paper p-3"><p className="text-2xl font-black">{value}</p><p className="text-sm font-bold text-ink/55">{label}</p>{sub && <p className="text-xs font-semibold text-ink/45">{sub}</p>}</div>;
}

function GenerationJobs({ jobs }: { jobs: QuestionGenerationJob[] }) {
  return (
    <div className="premium-card p-4">
      <h2 className="text-xl font-black">Generation jobs</h2>
      <div className="mt-3 space-y-2">
        {jobs.length === 0 && <p className="text-sm font-semibold text-ink/55">No generation jobs yet.</p>}
        {jobs.map((job) => (
          <div key={job.id} className="rounded-md border border-ink/10 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">{formatEnumLabel(job.subject)} / {job.microTopic}</p><span className="chip">{formatEnumLabel(job.status)}</span></div>
            <p className="mt-1 text-sm font-semibold text-ink/60">{job.generatedCount}/{job.count} generated via {job.provider} at {new Date(job.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEnumLabel(value: unknown) {
  return String(value ?? "").replaceAll("_", " ");
}

function ScheduleForm({ schedule, mutate }: { schedule: QuestionGenerationSchedule; mutate: Mutate }) {
  return (
    <form
      className="premium-card p-4"
      action={(formData) => {
        const payload = {
          enabled: formData.get("enabled") === "on",
          subject: String(formData.get("subject")),
          difficulty: String(formData.get("difficulty")),
          questionType: String(formData.get("questionType")),
          count: Number(formData.get("count")),
          microTopic: String(formData.get("microTopic")),
          provider: String(formData.get("provider")),
          frequency: String(formData.get("frequency")),
          runAt: String(formData.get("runAt"))
        };
        void mutate("/api/admin/questions/schedule", { method: "PATCH", body: JSON.stringify(payload) }, "Question generation schedule saved");
      }}
    >
      <div className="flex items-center gap-2"><CalendarClock className="text-gold" size={22} /><h2 className="text-xl font-black">Scheduled generation job</h2></div>
      <div className="mt-4 grid gap-3">
        <label className="flex items-center justify-between rounded-md bg-paper px-3 py-2 text-sm font-black">Enable scheduled job<input name="enabled" type="checkbox" defaultChecked={schedule.enabled} /></label>
        <select className="field" name="frequency" defaultValue={schedule.frequency}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option></select>
        <input className="field" name="runAt" type="time" defaultValue={schedule.runAt} />
        <select className="field" name="subject" defaultValue={schedule.subject}><option value="MATHS">Maths</option><option value="ENGLISH">English</option><option value="VERBAL_REASONING">Verbal Reasoning</option><option value="NON_VERBAL_REASONING">Non-Verbal Reasoning</option></select>
        <select className="field" name="difficulty" defaultValue={schedule.difficulty}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option><option value="ADVANCED">Advanced</option></select>
        <select className="field" name="questionType" defaultValue={schedule.questionType}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="SHORT_ANSWER">Short answer</option></select>
        <input className="field" name="microTopic" defaultValue={schedule.microTopic} />
        <input className="field" name="count" type="number" min={1} max={100} defaultValue={schedule.count} />
        <select className="field" name="provider" defaultValue={schedule.provider}><option value="GEMINI">Gemini</option><option value="GROQ">Groq</option><option value="INTERNAL">Internal fallback</option></select>
        <Button className="w-full"><Save size={16} /> Save schedule</Button>
      </div>
    </form>
  );
}
