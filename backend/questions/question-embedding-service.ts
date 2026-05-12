import crypto from "node:crypto";
import { prisma } from "@/backend/db/prisma";
import type { Question } from "@/backend/shared/types";
import { fingerprintQuestion } from "@/backend/questions/question-fingerprint";

const EMBEDDING_DIMENSIONS = 768;
const VECTOR_DUPLICATE_THRESHOLD = 0.88;
const EMBEDDING_MODEL = process.env.QUESTION_EMBEDDING_MODEL || "text-embedding-004";

type VectorMatch = {
  questionId: string;
  similarity: number;
  questionPreview: string;
};

let vectorSetupComplete = false;

export function questionEmbeddingText(question: Question) {
  return [
    payloadContent(question.stimulus),
    payloadContent(question.questionData)
  ].filter(Boolean).join("\n");
}

export async function findVectorDuplicate(question: Question): Promise<VectorMatch | null> {
  if (!process.env.DATABASE_URL) return null;
  await ensureVectorInfrastructure();

  const embedding = await embedQuestion(question);
  const vector = vectorLiteral(embedding);
  const rows = await prisma.$queryRawUnsafe<Array<{ question_id: string; similarity: number; question_preview: string }>>(
    `
      select
        question_id,
        1 - (embedding <=> $1::vector) as similarity,
        question_preview
      from question_embeddings
      where embedding_model = $2
        and 1 - (embedding <=> $1::vector) >= $3
      order by embedding <=> $1::vector
      limit 1
    `,
    vector,
    EMBEDDING_MODEL,
    VECTOR_DUPLICATE_THRESHOLD
  );

  const match = rows[0];
  if (!match) return null;
  return {
    questionId: match.question_id,
    similarity: Number(match.similarity),
    questionPreview: match.question_preview
  };
}

export async function saveQuestionEmbeddings(questions: Question[], questionIdsByContentHash: Map<string, string>) {
  if (!questions.length || !process.env.DATABASE_URL) return;
  await ensureVectorInfrastructure();

  for (const question of questions) {
    const fingerprint = fingerprintQuestion(question);
    const questionId = questionIdsByContentHash.get(fingerprint.contentHash);
    if (!questionId) continue;

    const embedding = await embedQuestion(question);
    await prisma.$executeRawUnsafe(
      `
        insert into question_embeddings (
          question_id,
          embedding_model,
          embedding,
          content_hash,
          semantic_hash,
          question_preview
        )
        values ($1::uuid, $2, $3::vector, $4, $5, $6)
        on conflict (question_id, embedding_model) do update set
          embedding = excluded.embedding,
          content_hash = excluded.content_hash,
          semantic_hash = excluded.semantic_hash,
          question_preview = excluded.question_preview,
          updated_at = now()
      `,
      questionId,
      EMBEDDING_MODEL,
      vectorLiteral(embedding),
      fingerprint.contentHash,
      fingerprint.semanticHash,
      previewText(question)
    );
  }
}

async function embedQuestion(question: Question) {
  const text = questionEmbeddingText(question);
  if (process.env.GEMINI_API_KEY) {
    const geminiEmbedding = await embedWithGemini(text);
    if (geminiEmbedding.length === EMBEDDING_DIMENSIONS) return geminiEmbedding;
  }
  return localHashEmbedding(text);
}

async function embedWithGemini(text: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          taskType: "SEMANTIC_SIMILARITY"
        })
      }
    );
    if (!response.ok) return [];
    const json = await response.json();
    return Array.isArray(json.embedding?.values) ? json.embedding.values.map(Number) : [];
  } catch {
    return [];
  }
}

function localHashEmbedding(text: string) {
  const values = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const token of tokens) {
    const digest = crypto.createHash("sha256").update(token).digest();
    const index = digest.readUInt16BE(0) % EMBEDDING_DIMENSIONS;
    const sign = digest[2] % 2 === 0 ? 1 : -1;
    values[index] += sign;
  }
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => Number((value / magnitude).toFixed(6)));
}

async function ensureVectorInfrastructure() {
  if (vectorSetupComplete) return;
  await prisma.$executeRawUnsafe("create extension if not exists vector");
  await prisma.$executeRawUnsafe(`
    create table if not exists question_embeddings (
      id uuid primary key default gen_random_uuid(),
      question_id uuid not null references question_master(question_id) on delete cascade,
      embedding_model varchar(120) not null,
      embedding vector(${EMBEDDING_DIMENSIONS}) not null,
      content_hash varchar(64),
      semantic_hash varchar(64),
      question_preview text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (question_id, embedding_model)
    )
  `);
  await prisma.$executeRawUnsafe("create index if not exists question_embeddings_embedding_idx on question_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100)");
  await prisma.$executeRawUnsafe("create index if not exists question_embeddings_content_hash_idx on question_embeddings(content_hash)");
  await prisma.$executeRawUnsafe("create index if not exists question_embeddings_semantic_hash_idx on question_embeddings(semantic_hash)");
  vectorSetupComplete = true;
}

function vectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(6)).join(",")}]`;
}

function previewText(question: Question) {
  return [
    question.stimulus?.content,
    question.questionData.content
  ].filter(Boolean).join(" | ").slice(0, 500);
}

function payloadContent(payload: Question["stimulus"] | Question["questionData"] | undefined) {
  if (!payload) return "";
  return payload.content;
}
