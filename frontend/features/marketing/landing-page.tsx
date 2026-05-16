import { ArrowRight, CheckCircle2, ChevronRight, CircleDot, LineChart, LockKeyhole, Sparkles } from "lucide-react";
import { AuthPanel } from "@/frontend/features/auth/auth-panel";
import { featureCards, heroSignals, navItems, outcomeStats, platformHighlights, subjectReadiness, tiers, weeklyPlan } from "@/frontend/features/marketing/landing-data";

export function LandingPage() {
  return (
    <main className="landing-shell min-h-screen overflow-hidden text-ink">
      <LandingNav />
      <HeroSection />
      <SignalStrip />
      <ExperienceSection />
      <OutcomesSection />
      <PlansSection />
      <AuthSection />
    </main>
  );
}

function LandingNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <a href="#" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white shadow-[0_14px_30px_rgba(21,28,45,0.2)]">
            <Sparkles size={20} />
          </span>
          <span>
            <span className="block text-base font-bold">GrammarForge 11+</span>
            <span className="block text-xs font-semibold text-ink/50">AI exam preparation cockpit</span>
          </span>
        </a>
        <div className="hidden items-center gap-1 rounded-lg border border-line/80 bg-white/80 p-1 shadow-sm md:flex">
          {navItems.map(([label, href]) => (
            <a key={label} href={href} className="rounded-md px-4 py-2 text-sm font-semibold text-ink/62 transition hover:bg-ink hover:text-white">
              {label}
            </a>
          ))}
        </div>
        <a href="#auth" className="hidden min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(21,28,45,0.22)] transition hover:bg-[#26314b] sm:inline-flex">
          Launch app <ArrowRight size={16} />
        </a>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-12 pt-10 lg:grid-cols-[1fr_520px] lg:pb-20 lg:pt-16">
      <div className="landing-grid absolute inset-x-5 top-8 -z-10 h-[32rem] rounded-lg" />
      <div className="relative z-10 max-w-4xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase text-sky-700 shadow-sm">
          <CircleDot size={14} /> Inspired by Deepak to help Devansh, built for every 11+ family
        </div>
        <h1 className="max-w-5xl text-5xl font-bold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
          A premium 11+ practice platform that turns effort into exam confidence.
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-ink/66">
          Realistic UK Grammar School practice, topic-wise analytics, AI-assisted review, safe student access,
          and motivation loops that parents can actually see.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#auth" className="landing-primary-button inline-flex min-h-12 items-center gap-2 rounded-md px-6 text-sm font-bold text-white">
            Start learning journey <ArrowRight size={17} />
          </a>
          <a href="#experience" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-line bg-white/84 px-6 text-sm font-bold text-ink shadow-sm transition hover:border-ink/20 hover:bg-white">
            Explore platform <ChevronRight size={17} />
          </a>
        </div>
        <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {heroSignals.map(([value, label, detail]) => (
            <div key={label} className="landing-mini-stat">
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase text-ink/46">{label}</p>
              <p className="mt-2 text-xs font-medium leading-4 text-ink/54">{detail}</p>
            </div>
          ))}
        </div>
      </div>
      <ProductCockpit />
    </section>
  );
}

function ProductCockpit() {
  return (
    <div className="relative z-10 lg:pt-5">
      <div className="landing-product-frame">
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-ink/45">Readiness cockpit</p>
            <h2 className="mt-1 text-2xl font-bold">Devansh Ingwale</h2>
          </div>
          <span className="rounded-md bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">On track</span>
        </div>
        <div className="grid gap-4 p-5">
          <div className="rounded-lg bg-ink p-4 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/68">Pass readiness forecast</p>
              <LineChart size={18} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold">82%</p>
                <p className="mt-1 text-sm font-medium text-white/62">+9% across the last 4 papers</p>
              </div>
              <div className="flex h-24 items-end gap-2">
                {[38, 54, 49, 64, 72, 84].map((height, index) => (
                  <span key={height + index} className="w-7 rounded-t-md bg-white/80" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {subjectReadiness.map((item) => (
              <div key={item.subject} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.subject}</p>
                    <p className="mt-1 text-xs font-semibold text-ink/52">{item.topic}</p>
                  </div>
                  <span className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700">{item.trend}</span>
                </div>
                <div className="mt-4 h-2 rounded-md bg-paper">
                  <div className="h-full rounded-md bg-sky-500" style={{ width: `${item.score}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs font-bold text-ink/56">
                  <span>{item.status}</span>
                  <span>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold">Weekly focus path</p>
              <span className="text-xs font-bold text-sky-700">Parent approved</span>
            </div>
            <div className="space-y-2">
              {weeklyPlan.map(([day, task, time, status]) => (
                <div key={day} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-md bg-paper px-3 py-2 text-sm">
                  <span className="font-bold text-ink/50">{day}</span>
                  <span className="font-semibold">{task}</span>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-ink/55">{status} / {time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="landing-float-card left-[-1rem] top-[6rem] hidden md:block">
        <CheckCircle2 className="text-sky-600" size={18} />
        <span>16-day streak protected</span>
      </div>
      <div className="landing-float-card bottom-[5rem] right-[-1rem] hidden md:block">
        <LockKeyhole className="text-sky-700" size={18} />
        <span>Device trusted for student login</span>
      </div>
    </div>
  );
}

function SignalStrip() {
  const signals = ["Realistic timing", "Reasoning speed", "SPaG and comprehension", "Fresh practice variety", "Parent progress view", "Reward missions"];
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10">
      <div className="landing-marquee grid gap-2 rounded-lg border border-line bg-white/78 p-3 shadow-sm md:grid-cols-6">
        {signals.map((signal) => <span key={signal} className="rounded-md bg-paper px-3 py-3 text-center text-xs font-bold uppercase text-ink/55">{signal}</span>)}
      </div>
    </section>
  );
}

function ExperienceSection() {
  return (
    <section id="experience" className="mx-auto max-w-7xl px-5 py-12">
      <SectionHeading eyebrow="Platform experience" title="Everything around the exam, not just the questions." copy="A polished product surface with strong proof strips, dense feature cards, and a clear 11+ learning story tailored to GrammarForge families." />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map(([title, copy, Icon]) => (
          <div key={title as string} className="landing-feature-card">
            <span className="landing-icon-tile"><Icon size={22} /></span>
            <h3 className="mt-5 text-xl font-bold">{title as string}</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-ink/62">{copy as string}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OutcomesSection() {
  return (
    <section id="outcomes" className="mx-auto max-w-7xl px-5 py-12">
      <div className="landing-dark-panel grid gap-8 rounded-lg p-6 text-white lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div>
          <p className="text-sm font-bold uppercase text-sky-200">Meaningful learning data</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight">Parents see what changed, students see what to win next.</h2>
          <p className="mt-4 text-base font-medium leading-7 text-white/68">
            Learning analytics use realistic 11+ patterns: pace, accuracy, topic confidence, review behaviour and daily practice completion.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {outcomeStats.map(([value, label, Icon]) => (
              <div key={label as string} className="rounded-lg border border-white/12 bg-white/8 p-4">
                <Icon className="text-sky-200" size={20} />
                <p className="mt-4 text-3xl font-bold">{value as string}</p>
                <p className="mt-1 text-sm font-semibold text-white/60">{label as string}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {platformHighlights.map(([title, copy, Icon]) => (
            <div key={title as string} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <Icon className="text-sky-200" size={20} />
              <h3 className="mt-4 font-bold">{title as string}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-white/58">{copy as string}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section id="plans" className="mx-auto max-w-7xl px-5 py-12">
      <SectionHeading eyebrow="Learning plans" title="Four clear pathways for different preparation needs." copy="Families can start safely, build momentum, accelerate results, or unlock deeper exam preparation support." />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="landing-plan-card">
            <div className="flex items-center justify-between">
              <span className="landing-icon-tile"><tier.icon size={21} /></span>
              <span className="rounded-md bg-paper px-3 py-1 text-xs font-bold text-ink/54">{tier.label}</span>
            </div>
            <h3 className="mt-6 text-2xl font-bold">{tier.name}</h3>
            <p className="mt-2 text-3xl font-bold text-ink">{tier.price}</p>
            <p className="mt-4 text-sm font-medium leading-6 text-ink/62">{tier.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 lg:grid-cols-[1fr_440px]">
      <div>
        <p className="text-sm font-bold uppercase text-sky-700">Ready when the family is</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Create the parent account, then link student access safely.</h2>
        <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-ink/62">
          Parents register first, then create a child-friendly student profile. It is designed for real families where many 11-year-olds do not yet have their own email address.
        </p>
      </div>
      <AuthPanel />
    </section>
  );
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold uppercase text-sky-700">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{title}</h2>
      <p className="mt-4 text-base font-medium leading-7 text-ink/62">{copy}</p>
    </div>
  );
}
