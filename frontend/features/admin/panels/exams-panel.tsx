"use client";

import { useEffect, useState } from "react";
import { BookCheck, Save, Trash2 } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type { ExamStatus, Subject } from "@/backend/shared/types";

type AdminExamRow = {
  id: string;
  studentName: string;
  subject: Subject;
  status: ExamStatus;
  score?: number;
  totalQuestions: number;
  startedAt?: string;
  completedAt?: string;
  isProctored: boolean;
};

type Mutate = (url: string, options: RequestInit, success: string) => Promise<void>;

export function ExamsPanel({ mutate }: { mutate: Mutate }) {
  const [exams, setExams] = useState<AdminExamRow[]>([]);

  async function load() {
    const response = await fetch("/api/admin/exams", { cache: "no-store" });
    const json = await response.json();
    setExams(json.exams ?? []);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/exams", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((json) => setExams(json.exams ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function runMutation(url: string, options: RequestInit, success: string) {
    await mutate(url, options, success);
    await load();
  }

  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-ink/10 p-4">
        <div className="flex items-center gap-2"><BookCheck className="text-teal" size={22} /><h2 className="text-xl font-black">Exam administration</h2></div>
        <p className="mt-1 text-sm font-semibold text-ink/55">View, update status, and delete exam records.</p>
      </div>
      <div className="divide-y divide-ink/10">
        {exams.length === 0 && <p className="p-4 text-sm font-semibold text-ink/55">No exam records yet.</p>}
        {exams.map((exam) => (
          <form
            key={exam.id}
            className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
            action={(formData) => {
              void runMutation(`/api/admin/exams/${exam.id}`, { method: "PATCH", body: JSON.stringify({ status: String(formData.get("status")) }) }, "Exam updated");
            }}
          >
            <div>
              <p className="font-black">{exam.studentName}</p>
              <p className="mt-1 text-xs font-bold text-ink/45">{formatEnumLabel(exam.subject)} · {exam.totalQuestions} questions · {exam.isProctored ? "Proctored" : "Standard"}</p>
            </div>
            <select className="field" name="status" defaultValue={exam.status}>
              {["DRAFT", "IN_PROGRESS", "PAUSED", "SUBMITTED", "GRADED", "ABANDONED"].map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
            </select>
            <div className="rounded-md bg-paper p-3 text-sm font-bold text-ink/60">Score: {exam.score ?? "-"}</div>
            <div className="flex gap-2">
              <Button><Save size={16} /> Save</Button>
              <button type="button" className="inline-flex min-h-11 items-center rounded-md border border-coral/30 px-3 font-bold text-coral" onClick={() => void runMutation(`/api/admin/exams/${exam.id}`, { method: "DELETE" }, "Exam deleted")}>
                <Trash2 size={16} />
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}

function formatEnumLabel(value: unknown) {
  return String(value ?? "").replaceAll("_", " ");
}
