import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { getPlatformConfig, updatePlatformConfig } from "@/backend/admin/platform-config-service";

const schema = z.object({
  activeLlmProvider: z.enum(["GEMINI", "GROQ", "INTERNAL"]).optional(),
  geminiEnabled: z.boolean().optional(),
  groqEnabled: z.boolean().optional(),
  redisCacheEnabled: z.boolean().optional(),
  aiDailyLimitFree: z.number().int().min(0).optional(),
  aiDailyLimitPro: z.number().int().min(0).optional(),
  aiDailyLimitPremium: z.number().int().min(0).optional(),
  maskedGeminiKey: z.string().optional(),
  maskedGroqKey: z.string().optional(),
  maskedStripeKey: z.string().optional()
});

export async function GET() {
  await requireUser(["ADMIN"]);
  return NextResponse.json({ config: getPlatformConfig() });
}

export async function PATCH(request: Request) {
  await requireUser(["ADMIN"]);
  const input = schema.parse(await request.json());
  return NextResponse.json({ config: updatePlatformConfig(input) });
}
