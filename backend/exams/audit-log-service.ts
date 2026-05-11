import type { AuditEvent } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { store } from "@/backend/platform/app-store";

export function addAuditLog(examId: string, eventType: string, details?: unknown) {
  const log: AuditEvent = {
    id: uid("audit"),
    examId,
    eventType,
    eventTimestamp: new Date().toISOString(),
    details
  };
  store().auditLogs.push(log);
  return log;
}

