import type { LlmProvider } from "@/backend/shared/types";
import { store } from "@/backend/platform/app-store";

export async function callQuestionGenerationLlm(provider: LlmProvider, prompt: string) {
  for (const candidate of llmProviderOrder(provider)) {
    const result = await callSingleQuestionGenerationProvider(candidate, prompt, provider);
    if (result?.text) return result;
  }
  return null;
}

function llmProviderOrder(preferred: LlmProvider) {
  const config = store().platformConfig;
  const candidates: LlmProvider[] =
    preferred === "INTERNAL"
      ? []
      : [
          preferred,
          preferred === "GEMINI" ? "GROQ" : "GEMINI"
        ];
  return candidates.filter((provider, index, list) => {
    if (list.indexOf(provider) !== index) return false;
    if (provider === "GEMINI") return config.geminiEnabled && Boolean(process.env.GEMINI_API_KEY);
    if (provider === "GROQ") return config.groqEnabled && Boolean(process.env.GROQ_API_KEY);
    return false;
  });
}

async function callSingleQuestionGenerationProvider(provider: LlmProvider, prompt: string, requestedProvider: LlmProvider) {
  if (provider === "GEMINI" && process.env.GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.62, topP: 0.9, responseMimeType: "application/json" }
        })
      }
    );
    if (response.ok) {
      const json = await response.json();
      return {
        text: json.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined,
        meta: {
          requestedProvider,
          actualProvider: "GEMINI" as const,
          source: "LLM" as const,
          requestedCount: 0,
          llmReturnedCount: 0,
          fallbackCount: 0,
          gemini: {
            promptTokenCount: json.usageMetadata?.promptTokenCount,
            candidatesTokenCount: json.usageMetadata?.candidatesTokenCount,
            totalTokenCount: json.usageMetadata?.totalTokenCount
          }
        }
      };
    }
  }

  if (provider === "GROQ" && process.env.GROQ_API_KEY) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.58,
        top_p: 0.9,
        response_format: { type: "json_object" }
      })
    });
    if (response.ok) {
      const json = await response.json();
      return {
        text: json.choices?.[0]?.message?.content as string | undefined,
        meta: {
          requestedProvider,
          actualProvider: "GROQ" as const,
          source: "LLM" as const,
          requestedCount: 0,
          llmReturnedCount: 0,
          fallbackCount: 0,
          groq: {
            remainingRequests: response.headers.get("x-ratelimit-remaining-requests"),
            remainingTokens: response.headers.get("x-ratelimit-remaining-tokens"),
            limitRequests: response.headers.get("x-ratelimit-limit-requests"),
            limitTokens: response.headers.get("x-ratelimit-limit-tokens"),
            resetRequests: response.headers.get("x-ratelimit-reset-requests"),
            resetTokens: response.headers.get("x-ratelimit-reset-tokens")
          }
        }
      };
    }
  }

  return null;
}
