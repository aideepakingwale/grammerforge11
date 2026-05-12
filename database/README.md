# Database Module

This module owns the production PostgreSQL schema for Supabase or Neon free tiers.

## Structure

```text
database/
  README.md
  prisma/
    schema.prisma
    schema.mysql.prisma
  seed.mysql.mjs
```

The application currently uses a demo in-memory repository under `backend/exams/` for fast local iteration. The schema here is the production contract for moving that repository to persistent PostgreSQL.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` and `DIRECT_URL` to your Supabase or Neon Postgres URLs.
3. Enable the PostgreSQL extensions before migration:

```sql
create extension if not exists citext;
create extension if not exists vector;
create extension if not exists pgcrypto;
```

4. Install dependencies and apply the schema:

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:vector:setup
```

## Notes

- `QuestionMaster.questionData` and answer option fields use `Json` so the UI can render text, SVG, image metadata, or structured question payloads without schema churn.
- `question_embeddings` uses Neon/Supabase Postgres `pgvector` to reject semantically similar generated questions before they enter the master question bank.
- `AiInsight` is persisted for durable dashboard reports while Upstash Redis acts as the hot cache for expensive AI responses.
- `Exam.serverStartedAt` and `Exam.serverExpiresAt` support the server-side timer controller required for secure proctored exams.
- `UsageEvent` supports subscription-tier usage limits for premium AI actions.

## Local MySQL

Use MySQL when you want a local relational database that feels closer to a traditional production setup.

1. Start MySQL:

```bash
docker compose -f docker-compose.mysql.yml up -d
```

2. In `.env`, set:

```env
DATABASE_URL="mysql://grammarforge:grammarforge_password@localhost:3306/grammarforge"
```

3. Push the MySQL schema and seed demo data:

```bash
npm run db:mysql:generate
npm run db:mysql:push
npm run db:mysql:seed
```

4. Open Prisma Studio for the MySQL schema:

```bash
npm run db:mysql:studio
```

The MySQL schema mirrors the production data model but replaces PostgreSQL-specific types such as `citext`, `uuid`, `inet`, timestamp timezone columns, and scalar string arrays with MySQL-compatible equivalents.
