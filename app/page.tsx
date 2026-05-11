import { ArrowRight, BarChart3, BookOpenCheck, BrainCircuit, ClipboardCheck, LockKeyhole, Medal, ShieldCheck, Sparkles, Target, Timer, TrendingUp } from "lucide-react";
import { AuthPanel } from "@/frontend/features/auth/auth-panel";

const features = [
  ["Real 11+ exam feel", "Timed papers, subject-specific patterns, realistic question flow, review flags, and instant results.", ClipboardCheck],
  ["AI study coach", "Clear explanations, weak-topic practice, parent study plans, and child-friendly coaching tips.", BrainCircuit],
  ["Parent intelligence", "Score trends, topic breakdowns, readiness charts, and focused action plans after every exam.", TrendingUp],
  ["Student motivation", "Rewards, badges, progress streaks, and targeted quick quizzes that keep learning encouraging.", Medal]
];

const benefitChips = ["Realistic timed papers", "AI explanations", "Parent progress dashboard", "Rewards and badges", "Topic-wise improvement", "Safe exam mode"];

const previewRows = [
  ["Maths", "Fractions", "82%", "Up 14%", "bg-teal/10 text-teal"],
  ["English", "Inference", "76%", "Focus", "bg-gold/10 text-gold"],
  ["NVR", "Rotation", "91%", "Strong", "bg-moss/10 text-moss"]
];

const stats = [
  ["24", "exams completed", BookOpenCheck, "text-teal"],
  ["42m", "average pace", Timer, "text-gold"],
  ["98%", "integrity score", LockKeyhole, "text-coral"]
];

export default function Home() {
  return (
    <main className="app-shell hero-shell min-h-screen overflow-hidden">
      <div className="hero-inner">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="floating-nav flex w-full items-center justify-between rounded-lg px-3 py-3 md:px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-teal p-2 text-white shadow-sm"><Sparkles size={20} /></div>
              <span className="text-lg font-extrabold">GrammarForge 11+</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="chip"><Target size={14} /> Personalised practice</span>
              <span className="chip"><ShieldCheck size={14} /> Exam confidence</span>
              <a href="#auth" className="gradient-button inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-black text-white transition">
                Start <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </nav>

        <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-5 pb-10 pt-6 lg:grid-cols-[1fr_460px]">
          <div className="pt-4 lg:pt-10">
            <div className="mb-5 inline-flex rounded-full border border-teal/15 bg-white/70 px-3 py-1 text-xs font-bold uppercase text-teal shadow-sm">
              AI-powered 11+ preparation for UK Grammar exams
            </div>
            <h1 className="max-w-5xl text-4xl font-extrabold leading-[1.08] text-ink sm:text-5xl md:text-6xl">
              Turn every practice paper into a clear path to improvement.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-ink/68">
              A premium SaaS platform for 11+ exam practice with realistic papers, parent analytics,
              gamified student progress, AI-assisted explanations, and focused topic-by-topic improvement.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#auth" className="gradient-button inline-flex min-h-11 items-center gap-2 rounded-md px-5 text-sm font-black text-white transition">
                Launch dashboard <ArrowRight size={17} />
              </a>
              <span className="inline-flex min-h-11 items-center rounded-md border border-line bg-white/80 px-4 text-sm font-bold text-ink shadow-sm">Inspired by Deepak, created for Devansh, built for every 11+ family</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {benefitChips.map((item) => (
                <span key={item} className="chip">{item}</span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-rail hero-preview-grid rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="eyebrow">Live learning cockpit</p>
                  <h2 className="mt-1 text-2xl font-extrabold">Devansh Ingwale</h2>
                </div>
                <div className="rounded-md bg-skysoft p-2 text-teal"><BarChart3 size={22} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {stats.map(([value, label, Icon, color]) => (
                  <div key={label as string} className="bento-card p-3">
                    <Icon className={color as string} size={20} />
                    <p className="mt-3 text-2xl font-extrabold">{value as string}</p>
                    <p className="text-xs font-bold text-ink/55">{label as string}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {previewRows.map(([subject, topic, score, status, tone]) => (
                  <div key={subject} className="flex items-center justify-between rounded-md border border-line bg-white/86 px-3 py-2 text-sm shadow-sm">
                    <div>
                      <p className="font-extrabold">{subject}</p>
                      <p className="text-xs font-bold text-ink/50">{topic}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold">{score}</p>
                      <p className={`rounded px-2 py-0.5 text-xs font-black ${tone}`}>{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <AuthPanel />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-12 md:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, copy, Icon]) => (
            <div key={title as string} className="bento-card p-5">
              <div className="mb-4 inline-flex rounded-md bg-teal/10 p-2 text-teal">
                <Icon size={22} />
              </div>
              <h2 className="text-lg font-extrabold">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/62">{copy as string}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12">
          <div className="soft-panel grid gap-5 rounded-lg p-5 md:grid-cols-[1fr_1fr_1fr]">
            <div>
              <p className="eyebrow">From bank to insight</p>
              <h2 className="mt-2 text-2xl font-extrabold">One flow for exams, review, and growth.</h2>
            </div>
            <div className="rounded-md bg-white/80 p-4 shadow-sm">
              <p className="text-3xl font-black text-teal">4</p>
              <p className="mt-1 text-sm font-bold text-ink/60">core 11+ subjects with realistic practice journeys.</p>
            </div>
            <div className="rounded-md bg-white/80 p-4 shadow-sm">
              <p className="text-3xl font-black text-moss">Daily</p>
              <p className="mt-1 text-sm font-bold text-ink/60">parent-visible progress, rewards, and focus recommendations.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
