import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { listPublicPages, upsertPublicPage } from "@/backend/exams/demo-store";

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({ pages: listPublicPages() });
}

export async function POST(request: Request) {
  await requireUser(["ADMIN"]);
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json({ page: upsertPublicPage(input) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save page" }, { status: 400 });
  }
}
