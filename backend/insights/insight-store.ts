import type { Insight } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { store } from "@/backend/platform/app-store";

export function upsertInsight(insight: Omit<Insight, "id" | "generatedAt">) {
  const data = store();
  const existing = data.insights.find(
    (item) => item.userId === insight.userId && item.insightType === insight.insightType && item.expiresAt > new Date().toISOString()
  );
  if (existing) return existing;

  const created: Insight = {
    ...insight,
    id: uid("insight"),
    generatedAt: new Date().toISOString()
  };
  data.insights.push(created);
  return created;
}

