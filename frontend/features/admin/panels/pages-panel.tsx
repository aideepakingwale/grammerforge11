"use client";

import { FileText, Save, Trash2 } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type { PublicPage } from "@/backend/shared/types";

type Mutate = (url: string, options: RequestInit, success: string) => Promise<void>;

export function PagesPanel({ pages, mutate }: { pages: PublicPage[]; mutate: Mutate }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {pages.map((page) => (
          <form
            key={page.id}
            className="premium-card p-4"
            action={(formData) => {
              const payload = {
                slug: String(formData.get("slug")),
                title: String(formData.get("title")),
                body: String(formData.get("body")),
                status: String(formData.get("status"))
              };
              void mutate(`/api/admin/pages/${page.id}`, { method: "PATCH", body: JSON.stringify(payload) }, "Public page saved");
            }}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input className="field" name="title" defaultValue={page.title} />
              <select className="field" name="status" defaultValue={page.status}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <input className="field mt-3" name="slug" defaultValue={page.slug} />
            <textarea className="field mt-3 min-h-28" name="body" defaultValue={page.body} />
            <div className="mt-3 flex gap-2">
              <Button><Save size={16} /> Save page</Button>
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-coral/30 px-3 text-sm font-black text-coral" onClick={() => void mutate(`/api/admin/pages/${page.id}`, { method: "DELETE" }, "Public page deleted")}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </form>
        ))}
      </div>
      <form
        className="premium-card p-4"
        action={(formData) => {
          const payload = {
            slug: String(formData.get("slug")),
            title: String(formData.get("title")),
            body: String(formData.get("body")),
            status: String(formData.get("status"))
          };
          void mutate("/api/admin/pages", { method: "POST", body: JSON.stringify(payload) }, "Public page created");
        }}
      >
        <h2 className="text-xl font-black">Create public page</h2>
        <div className="mt-4 space-y-3">
          <input className="field" name="title" placeholder="Page title" required />
          <input className="field" name="slug" placeholder="privacy-policy" required />
          <select className="field" name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <textarea className="field min-h-36" name="body" placeholder="Page content" required />
          <Button className="w-full"><FileText size={16} /> Create page</Button>
        </div>
      </form>
    </div>
  );
}
