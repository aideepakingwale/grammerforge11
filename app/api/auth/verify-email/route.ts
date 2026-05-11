import { NextResponse } from "next/server";
import { confirmEmail } from "@/backend/auth/users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?verified=missing-token", url.origin));
  }

  try {
    await confirmEmail(token);
    return NextResponse.redirect(new URL("/?verified=success", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/?verified=failed", url.origin));
  }
}
