"use client";

import { Save } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type { PlatformConfig } from "@/backend/shared/types";

type Mutate = (url: string, options: RequestInit, success: string) => Promise<void>;

export function ConfigPanel({ config, mutate }: { config: PlatformConfig; mutate: Mutate }) {
  return (
    <form
      className="premium-card p-5"
      action={(formData) => {
        const payload = {
          activeLlmProvider: String(formData.get("activeLlmProvider")),
          geminiEnabled: formData.get("geminiEnabled") === "on",
          groqEnabled: formData.get("groqEnabled") === "on",
          redisCacheEnabled: formData.get("redisCacheEnabled") === "on",
          aiDailyLimitFree: Number(formData.get("aiDailyLimitFree")),
          aiDailyLimitPro: Number(formData.get("aiDailyLimitPro")),
          aiDailyLimitPremium: Number(formData.get("aiDailyLimitPremium")),
          maskedGeminiKey: String(formData.get("maskedGeminiKey")),
          maskedGroqKey: String(formData.get("maskedGroqKey")),
          maskedStripeKey: String(formData.get("maskedStripeKey"))
        };
        void mutate("/api/admin/config", { method: "PATCH", body: JSON.stringify(payload) }, "Configuration saved");
      }}
    >
      <h2 className="text-xl font-black">Configuration management</h2>
      <p className="mt-1 text-sm font-semibold text-ink/55">Switch LLM providers and manage masked operational keys.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-black">Active LLM
          <select className="field mt-2" name="activeLlmProvider" defaultValue={config.activeLlmProvider}>
            <option value="GEMINI">Gemini</option>
            <option value="GROQ">Groq</option>
            <option value="INTERNAL">Internal fallback</option>
          </select>
        </label>
        <label className="text-sm font-black">Gemini key<input className="field mt-2" name="maskedGeminiKey" defaultValue={config.maskedGeminiKey} /></label>
        <label className="text-sm font-black">Groq key<input className="field mt-2" name="maskedGroqKey" defaultValue={config.maskedGroqKey} /></label>
        <label className="text-sm font-black">Stripe key<input className="field mt-2" name="maskedStripeKey" defaultValue={config.maskedStripeKey} /></label>
        <label className="text-sm font-black">Foundation AI daily limit<input className="field mt-2" name="aiDailyLimitFree" type="number" defaultValue={config.aiDailyLimitFree} /></label>
        <label className="text-sm font-black">Alpha AI daily limit<input className="field mt-2" name="aiDailyLimitPro" type="number" defaultValue={config.aiDailyLimitPro} /></label>
        <label className="text-sm font-black">Apex AI daily limit<input className="field mt-2" name="aiDailyLimitPremium" type="number" defaultValue={config.aiDailyLimitPremium} /></label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {config.llmQuota.map((quota) => (
          <div key={quota.provider} className="rounded-md border border-ink/10 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black">{quota.provider}</h3>
              <span className={`chip ${quota.enabled && quota.configured ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"}`}>
                {quota.enabled && quota.configured ? "Ready" : quota.enabled ? "Missing key" : "Disabled"}
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">{quota.remainingToday === null ? "Unlimited" : quota.remainingToday}</p>
            <p className="text-sm font-bold text-ink/55">estimated remaining today</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-ink/55">Used {quota.usedToday} of {quota.dailyLimit}. Resets {new Date(quota.resetAt).toLocaleTimeString()}.</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {[["geminiEnabled", "Gemini enabled", config.geminiEnabled], ["groqEnabled", "Groq enabled", config.groqEnabled], ["redisCacheEnabled", "Redis cache enabled", config.redisCacheEnabled]].map(([name, label, checked]) => (
          <label key={name as string} className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-black">
            <input name={name as string} type="checkbox" defaultChecked={Boolean(checked)} /> {label as string}
          </label>
        ))}
      </div>
      <Button className="mt-5"><Save size={16} /> Save config</Button>
    </form>
  );
}
