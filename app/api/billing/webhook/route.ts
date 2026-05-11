import { NextResponse } from "next/server";
import { stripeClient } from "@/backend/billing/stripe";

export async function POST(request: Request) {
  const stripe = stripeClient();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (!stripe || !signature || !webhookSecret) {
    return NextResponse.json({ received: true, mode: "demo" });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    // Production implementation updates Subscription/User tier from checkout and invoice events.
    return NextResponse.json({ received: true, type: event.type });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
}
