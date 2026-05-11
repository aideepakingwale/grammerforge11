import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role, SafeUser } from "@/backend/shared/types";
import { findUser } from "@/backend/auth/users";

const cookieName = "grammarforge_session";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me");
}

export function authSecret() {
  return secret();
}

export async function createSession(user: SafeUser) {
  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    tier: user.subscriptionTier
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function currentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret());
    const userId = verified.payload.sub;
    return userId ? findUser(userId) : null;
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user) throw new Response("Unauthenticated", { status: 401 });
  if (roles && !roles.includes(user.role)) throw new Response("Forbidden", { status: 403 });
  return user;
}
