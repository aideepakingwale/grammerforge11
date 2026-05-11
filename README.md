# GrammarForge 11+ SaaS

AI-assisted 11+ Grammar School exam preparation SaaS for students and parents. This demo build is tailored for Deepak Ingwale and Devansh Ingwale, with a production-ready Next.js structure, PostgreSQL schema, JWT auth, Stripe billing hooks, Upstash Redis caching hooks, and Gemini/Groq free-tier AI integration.

## What Is Included

- Modern responsive Next.js app with TypeScript and Tailwind CSS.
- Student dashboard with gamification, XP, rewards, quick quizzes, and encouraging coaching.
- Parent dashboard with analytics, subject trends, topic breakdowns, and study-plan style insights.
- Superadmin panel for user CRUD, subscription upgrades, AI/config switching, package feature gates, reports, and public page content.
- Configurable commercial tiers: Foundation, Alpha, Velocity, and Apex.
- Plan-based exam access rules for daily subject limits, question counts, durations, repeat-subject control, Apex custom LLM exams, and shareable generated exams.
- Admin question-bank loading from LLM/fallback generation on demand or through a scheduled cron job.
- Post-exam external AI prompt helper for enabled tiers, copying full question/option/answer prompts for ChatGPT, Gemini, Claude, or Copilot without using platform LLM quota.
- Exam engine with timer, sequential navigation, answer autosave, mark for review, formal exam-paper layout, and result review.
- Subject-specific 11+ question bank for Maths, English, Verbal Reasoning, and Non-Verbal Reasoning.
- NVR visual questions rendered as figures/SVGs in both exam and review screens.
- Prisma PostgreSQL schema for users, subscriptions, exams, questions, answers, audit logs, AI insights, and usage tracking.
- Serverless-ready API routes for auth, exams, answers, audit events, AI insights, and Stripe checkout/webhooks.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers
- Database: PostgreSQL via Supabase or Neon free tier
- ORM: Prisma
- Cache: Upstash Redis free tier
- AI: Gemini API free tier first, Groq free tier fallback
- Payments: Stripe
- Hosting: Vercel Hobby tier

## Project Structure

```text
app/                         Thin Next.js routing layer
app/api/                     Serverless route handlers that call backend modules
frontend/shared/ui/          Reusable UI primitives
frontend/features/auth/      Login, registration, and demo auth UI
frontend/features/dashboard/ Student and parent dashboard UI
frontend/features/admin/     Superadmin console UI
frontend/features/exams/     Exam launcher and exam engine UI
frontend/features/navigation/Navigation/session UI
backend/auth/                JWT sessions and exam access rules
backend/ai/                  Gemini/Groq insight generation and Redis caching
backend/billing/             Stripe client and tier price helpers
backend/exams/               Demo repository, exam creation, grading, audit logs
backend/gamification/        XP, reward, and badge calculations
backend/questions/           11+ subject-specific question bank
backend/shared/              Shared domain types and utilities
database/prisma/             Production PostgreSQL Prisma schema
database/prisma/schema.mysql.prisma Local MySQL Prisma schema
.env.example                 Environment variable template
```

## Local Development

### 1. Install prerequisites

Use Node.js 20 or newer.

```bash
node --version
npm --version
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

For pure local demo mode, the app runs without external services. To use a real database, set `DATABASE_URL` and `DIRECT_URL` in `.env`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo users:

```text
Student: student@example.com / Password123!
Parent:  parent@example.com  / Password123!
Admin:   admin@example.com   / Password123!
```

Admin console:

```text
http://localhost:3000/admin
```

## Useful Commands

```bash
npm run dev          # Start local development server
npm run lint         # Run ESLint
npm run build        # Production build
npm run start        # Run production build locally
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Apply Prisma migration locally
npm run db:push      # Push schema to hosted database
npm run db:studio    # Open Prisma Studio
```

## Database Setup: Supabase or Neon

Use either Supabase Postgres or Neon Postgres on the free tier.

### Supabase

1. Create a free Supabase project.
2. Open SQL Editor and run:

```sql
create extension if not exists citext;
```

3. Copy the pooled connection string into `DATABASE_URL`.
4. Copy the direct connection string into `DIRECT_URL`.
5. Apply schema:

```bash
npm run db:generate
npm run db:push
```

## Local MySQL Setup

For local database testing with MySQL:

```bash
docker compose -f docker-compose.mysql.yml up -d
```

Use this local `.env` value while running MySQL:

```env
DATABASE_URL="mysql://grammarforge:grammarforge_password@localhost:3306/grammarforge"
AUTH_SECRET="replace-with-a-long-random-secret"
GEMINI_API_KEY=""
GROQ_API_KEY=""
```

Then create tables and seed demo records:

```bash
npm run db:mysql:generate
npm run db:mysql:push
npm run db:mysql:seed
npm run db:mysql:studio
```

Demo seeded users:

```text
Student: student@example.com / Password123!
Parent:  parent@example.com  / Password123!
Admin:   admin@example.com   / Password123!
```

Note: the current app runtime still uses the modular demo repository for fast UI testing. The MySQL schema and seed give you the real relational model locally; the next engineering step is swapping the repository implementation from the demo store to Prisma-backed persistence.

### Neon

1. Create a free Neon project.
2. Copy the pooled connection string into `DATABASE_URL`.
3. Copy the direct connection string into `DIRECT_URL`.
4. Apply schema:

```bash
npm run db:generate
npm run db:push
```

## Zero-Cost Cloud Deployment

### 1. Push code to GitHub

Do not commit `node_modules`, `.next`, or `.env`. They are ignored by `.gitignore`.

```bash
git init
git add .
git commit -m "Initial GrammarForge 11+ SaaS app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel Hobby

1. Create a free Vercel account.
2. Import the GitHub repository.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Add environment variables listed below.
7. Deploy.

### 3. Required Vercel environment variables

Minimum production variables:

```text
AUTH_SECRET
NEXT_PUBLIC_APP_URL
```

Database variables:

```text
DATABASE_URL
DIRECT_URL
```

Optional cache:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Optional AI:

```text
GEMINI_API_KEY
GROQ_API_KEY
```

Scheduled question generation:

```text
CRON_SECRET
```

The admin panel stores the schedule. Vercel Cron calls `/api/cron/question-generation` hourly via `vercel.json`; the endpoint only generates questions when the admin schedule is enabled. For local testing, call:

```bash
curl "http://localhost:3000/api/cron/question-generation?secret=replace-with-a-cron-secret"
```

Optional Stripe:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_FOUNDATION_PRICE_ID
STRIPE_ALPHA_PRICE_ID
STRIPE_VELOCITY_PRICE_ID
STRIPE_APEX_PRICE_ID
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

On Windows PowerShell, if OpenSSL is unavailable:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Upstash Redis Free-Tier Cache

1. Create a free Upstash Redis database.
2. Copy the REST URL into `UPSTASH_REDIS_REST_URL`.
3. Copy the REST token into `UPSTASH_REDIS_REST_TOKEN`.

The app uses Redis for expensive AI dashboard insight caching. If Redis is not configured, it falls back safely to local generation.

## Gemini or Groq Free-Tier AI

Set one or both:

```text
GEMINI_API_KEY
GROQ_API_KEY
```

AI insights use Gemini first, then Groq, then a local deterministic fallback. Prompts avoid sending personal data.

## Stripe Setup

1. Create a Stripe account.
2. Create recurring prices for Foundation, Alpha, Velocity, and Apex.
3. Add price IDs to:

```text
STRIPE_FOUNDATION_PRICE_ID
STRIPE_ALPHA_PRICE_ID
STRIPE_VELOCITY_PRICE_ID
STRIPE_APEX_PRICE_ID
```

4. Add `STRIPE_SECRET_KEY`.
5. Create a webhook endpoint:

```text
https://your-vercel-domain.vercel.app/api/billing/webhook
```

6. Subscribe the webhook to subscription and checkout events.
7. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

## Production Checklist

- Replace demo in-memory persistence with Prisma queries for all exam/user records.
- Seed the `question_master` table with licensed/original 11+ content.
- Add email verification and password reset provider.
- Add OAuth providers if required.
- Add Stripe customer portal for self-service billing.
- Configure Vercel environment variables for Production and Preview.
- Run `npm run lint` and `npm run build` before every deployment.
- Review UK GDPR requirements before handling real child data.

## Current Verification

The current codebase passes:

```bash
npm run lint
npm run build
```

## Notes

This is a production-shaped MVP. It has the full SaaS shell, responsive UI, dashboards, exam flow, gamification, AI/cache/payment integration points, and a complete PostgreSQL schema. For a real public launch, the next essential step is wiring the demo store to Prisma persistence and seeding a larger, original question bank.
