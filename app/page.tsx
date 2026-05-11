import { Activity, BarChart3, BookOpenCheck, DatabaseZap, LockKeyhole, ShieldCheck, Sparkles, Timer, TrendingUp } from "lucide-react";
import { AuthPanel } from "@/frontend/features/auth/auth-panel";

const features = [
  ["Hybrid generation", "95% question-bank retrieval with free-tier Gemini/Groq fallback.", Sparkles],
  ["Secure exam mode", "Fullscreen, focus monitoring, autosave, audit logs, server timer fields.", ShieldCheck],
  ["Timed exam engine", "Sequential navigation, review flags, live countdown, instant marking.", Timer],
  ["Parent analytics", "Subject trends, topic breakdowns, cached AI plans, SaaS tier gates.", TrendingUp]
];

const previewRows = [
  ["Maths", "Fractions", "82%", "Up 14%"],
  ["English", "Inference", "76%", "Focus"],
  ["Verbal", "Anagrams", "91%", "Strong"]
];

export default function Home() {
  return (
    <main className="app-shell min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-ink p-2 text-white"><Sparkles size={20} /></div>
          <span className="text-lg font-black">GrammarForge 11+</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <span className="chip"><DatabaseZap size={14} /> Supabase-ready</span>
          <span className="chip"><Activity size={14} /> AI cached</span>
          <a href="#auth" className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm font-black text-white shadow-sm transition hover:bg-teal">Try demo</a>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-8 pt-3 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[1fr_460px]">
        <div>
          <p className="eyebrow mb-3">Zero-cost startup architecture</p>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.03] text-ink md:text-6xl">
            AI-guided 11+ practice, built like a premium exam platform.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/68">
            A full-stack 11+ Grammar School preparation platform with AI question support, proctored exams,
            role-based dashboards, Stripe-ready subscriptions, and cache-first analytics.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="chip">Vercel</span>
            <span className="chip">Supabase / Neon</span>
            <span className="chip">Upstash Redis</span>
            <span className="chip">Gemini / Groq</span>
            <span className="chip">Stripe</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-rail hero-preview-grid rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Live progress</p>
                <h2 className="mt-1 text-xl font-black">Devansh Ingwale</h2>
              </div>
              <div className="rounded-md bg-ink p-2 text-white"><BarChart3 size={22} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="premium-card p-3">
                <BookOpenCheck className="text-teal" size={20} />
                <p className="mt-3 text-2xl font-black">24</p>
                <p className="text-xs font-bold text-ink/55">exams</p>
              </div>
              <div className="premium-card p-3">
                <Timer className="text-gold" size={20} />
                <p className="mt-3 text-2xl font-black">42m</p>
                <p className="text-xs font-bold text-ink/55">avg pace</p>
              </div>
              <div className="premium-card p-3">
                <LockKeyhole className="text-coral" size={20} />
                <p className="mt-3 text-2xl font-black">98%</p>
                <p className="text-xs font-bold text-ink/55">integrity</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {previewRows.map(([subject, topic, score, status]) => (
                <div key={subject} className="flex items-center justify-between rounded-md bg-white/80 px-3 py-2 text-sm shadow-sm">
                  <div>
                    <p className="font-black">{subject}</p>
                    <p className="text-xs font-bold text-ink/50">{topic}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{score}</p>
                    <p className="text-xs font-bold text-teal">{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <AuthPanel />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-5 pb-10 md:grid-cols-2 lg:grid-cols-4">
        {features.map(([title, copy, Icon]) => (
          <div key={title as string} className="premium-card p-4">
            <div className="mb-3 inline-flex rounded-md bg-teal/10 p-2 text-teal">
              <Icon size={22} />
            </div>
            <h2 className="font-black">{title as string}</h2>
            <p className="mt-1 text-sm leading-6 text-ink/62">{copy as string}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
