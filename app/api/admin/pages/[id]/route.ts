import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { deletePublicPage, upsertPublicPage } from "@/backend/admin/public-pages-service";

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    return NextResponse.json({ page: upsertPublicPage({ ...input, id }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save page" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(["ADMIN"]);
  try {
    const { id } = await params;
    return NextResponse.json(deletePublicPage(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete page" }, { status: 400 });
  }
}
