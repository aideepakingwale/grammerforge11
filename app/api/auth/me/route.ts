import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/session";

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
