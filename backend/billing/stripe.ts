import Stripe from "stripe";
import type { Tier } from "@/backend/shared/types";

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function priceForTier(tier: Tier) {
  if (tier === "FOUNDATION") return process.env.STRIPE_FOUNDATION_PRICE_ID;
  if (tier === "ALPHA") return process.env.STRIPE_ALPHA_PRICE_ID;
  if (tier === "VELOCITY") return process.env.STRIPE_VELOCITY_PRICE_ID;
  if (tier === "APEX") return process.env.STRIPE_APEX_PRICE_ID;
  return null;
}
