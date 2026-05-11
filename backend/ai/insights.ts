import { Redis } from "@upstash/redis";
import type { Exam, LlmProvider, SafeUser } from "@/backend/shared/types";
import { buildPerformanceAnalytics } from "@/backend/analytics/performance";
import { examsForStudent, getPlatformConfig, upsertInsight } from "@/backend/exams/demo-store";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

async function cached<T>(key: string, ttlSeconds: number, factory: () => Promise<T>) {
  if (redis) {
    const hit = await redis.get<T>(key);
    if (hit) return hit;
  }
  const value = await factory();
  if (redis) await redis.set(key, value, { ex: ttlSeconds });
  return value;
}

function insightProviderOrder(preferred: LlmProvider) {
  const config = getPlatformConfig();
  const candidates: LlmProvider[] =
    preferred === "INTERNAL"
      ? []
      : [
          preferred,
          preferred === "GEMINI" ? "GROQ" : "GEMINI"
        ];
  return candidates.filter((provider, index, list) => {
    if (list.indexOf(provider) !== index) return false;
    if (provider === "GEMINI") return config.geminiEnabled && Boolean(process.env.GEMINI_API_KEY);
    if (provider === "GROQ") return config.groqEnabled && Boolean(process.env.GROQ_API_KEY);
    return false;
  });
}

async function generateWithConfiguredProvider(prompt: string) {
  const config = getPlatformConfig();
  for (const provider of insightProviderOrder(config.activeLlmProvider)) {
    const text = await callInsightProvider(provider, prompt);
    if (text) return { text, provider };
  }
  return null;
}

async function callInsightProvider(provider: LlmProvider, prompt: string) {
  if (provider === "GEMINI" && process.env.GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (response.ok) {
      const json = await response.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    }
  }

  if (process.env.GROQ_API_KEY) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });
    if (response.ok) {
      const json = await response.json();
      return json.choices?.[0]?.message?.content as string | undefined;
    }
  }

  return null;
}

export async function dashboardInsights(student: SafeUser, audience: "parent" | "student") {
  const key = `insights:${student.id}:${audience}`;
  return cached(key, 60 * 60 * 6, async () => {
    const exams = examsForStudent(student.id);
    const recent = exams.slice(-5);
    const performance = buildPerformanceAnalytics(exams);
    const prompt = [
      "You are an expert UK 11+ tutor. Do not include personal data.",
      `Audience: ${audience}.`,
      `Recent exam scores: ${recent.map((exam) => `${exam.subject}:${exam.score ?? 0}`).join(", ") || "none yet"}.`,
      `Subject accuracy: ${performance.subjects.map((item) => `${item.label} ${item.accuracy}%`).join(", ") || "none yet"}.`,
      `Strong topics: ${performance.strengths.map((item) => `${item.label} ${item.accuracy}%`).join(", ") || "none yet"}.`,
      `Focus topics: ${performance.focusAreas.map((item) => `${item.label} ${item.accuracy}%`).join(", ") || "none yet"}.`,
      "Return concise JSON with summary, strengths, focusAreas, and plan. Analyse subject and topic performance separately."
    ].join("\n");
    const generated = await generateWithConfiguredProvider(prompt);
    const fallback = buildLocalInsight(recent, audience);
    const content = generated ? { summary: generated.text, generatedBy: generated.provider } : fallback;

    return upsertInsight({
      userId: student.id,
      insightType: audience === "parent" ? "PARENT_WEEKLY_REPORT" : "STUDENT_COACHING_TIP",
      insightContent: content,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString()
    });
  });
}

function buildLocalInsight(exams: Exam[], audience: "parent" | "student") {
  const average =
    exams.length === 0 ? 0 : Math.round(exams.reduce((sum, exam) => sum + (exam.score ?? 0), 0) / exams.length);
  const performance = buildPerformanceAnalytics(exams);
  const strengths = performance.strengths.map((item) => `${item.label} (${item.accuracy}%)`);
  const focusAreas = performance.focusAreas.map((item) => `${item.label} (${item.accuracy}%)`);
  if (audience === "student") {
    return {
      summary: average > 70 ? "You are building strong exam habits." : "You have a clear next step and plenty of room to grow.",
      strengths: strengths.length ? strengths : ["Keeping going", "Learning from feedback"],
      focusAreas: focusAreas.length ? focusAreas : ["Read each question twice", "Practise one weak topic daily"],
      plan: ["Try one quick quiz today", "Review explanations after each answer", "Celebrate every improvement"]
    };
  }
  return {
    summary: `Recent average is ${average}%. Strong areas and focus areas are now calculated from subject and topic-level marks, not just the headline score.`,
    strengths: strengths.length ? strengths : ["Regular practice", "Clear question-level feedback"],
    focusAreas: focusAreas.length ? focusAreas : ["Micro-topic revision", "Timed accuracy", "Short-answer explanation quality"],
    plan: [
      focusAreas[0] ? `Spend 15 minutes on ${focusAreas[0]} before the next paper` : "Schedule 15 minutes of targeted practice four days per week",
      "Review flagged questions with the student",
      strengths[0] ? `Keep momentum in ${strengths[0]} with quick confidence drills` : "Use Apex proctored exams once weekly"
    ]
  };
}
