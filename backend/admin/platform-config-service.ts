import type { PlatformConfig } from "@/backend/shared/types";
import { llmQuotaSnapshot, store } from "@/backend/exams/demo-store";

export function getPlatformConfig() {
  const data = store();
  data.platformConfig = {
    ...data.platformConfig,
    llmQuota: llmQuotaSnapshot()
  };
  return data.platformConfig;
}

export function updatePlatformConfig(input: Partial<PlatformConfig>) {
  const data = store();
  data.platformConfig = {
    ...data.platformConfig,
    ...input,
    maskedGeminiKey: input.maskedGeminiKey ?? data.platformConfig.maskedGeminiKey,
    maskedGroqKey: input.maskedGroqKey ?? data.platformConfig.maskedGroqKey,
    maskedStripeKey: input.maskedStripeKey ?? data.platformConfig.maskedStripeKey,
    llmQuota: llmQuotaSnapshot(),
    updatedAt: new Date().toISOString()
  };
  return data.platformConfig;
}
