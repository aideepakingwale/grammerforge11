import type { PublicPage } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { store } from "@/backend/exams/demo-store";

export function listPublicPages() {
  return store().publicPages;
}

export function upsertPublicPage(input: Omit<PublicPage, "id" | "updatedAt"> & { id?: string }) {
  const data = store();
  const existing = data.publicPages.find((page) => page.id === input.id || page.slug === input.slug);
  if (existing) {
    existing.slug = input.slug;
    existing.title = input.title;
    existing.body = input.body;
    existing.status = input.status;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const created: PublicPage = {
    ...input,
    id: uid("page"),
    updatedAt: new Date().toISOString()
  };
  data.publicPages.push(created);
  return created;
}

export function deletePublicPage(pageId: string) {
  const data = store();
  const before = data.publicPages.length;
  data.publicPages = data.publicPages.filter((page) => page.id !== pageId);
  if (data.publicPages.length === before) throw new Error("Page not found.");
  return { ok: true };
}
