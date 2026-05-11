import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/backend/auth/session";
import { priceForTier, stripeClient } from "@/backend/billing/stripe";

const schema = z.object({
  tier: z.enum(["FOUNDATION", "ALPHA", "VELOCITY", "APEX"])
});

export async function POST(request: Request) {
  const user = await requireUser(["PARENT"]);
  const { tier } = schema.parse(await request.json());
  const stripe = stripeClient();
  const price = priceForTier(tier);

  if (!stripe || !price) {
    return NextResponse.json({
      mode: "demo",
      message: `Stripe is not configured. In production this would open checkout for ${tier}.`
    });
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/dashboard/parent?billing=success`,
    cancel_url: `${origin}/dashboard/parent?billing=cancelled`,
    metadata: { userId: user.id, tier }
  });

  return NextResponse.json({ url: session.url });
}
