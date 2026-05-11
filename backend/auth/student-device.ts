import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SafeUser } from "@/backend/shared/types";
import { prisma } from "@/backend/db/prisma";
import { authSecret } from "@/backend/auth/session";

const pendingStudentCookieName = "grammarforge_student_pending";
const trustedStudentDeviceCookieName = "grammarforge_student_device";

function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPendingStudentChallenge(userId: string) {
  const token = await new SignJWT({ sub: userId, purpose: "student_code" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(authSecret());
  const cookieStore = await cookies();
  cookieStore.set(pendingStudentCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });
}

export async function pendingStudentUserId() {
  const token = (await cookies()).get(pendingStudentCookieName)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, authSecret());
    return verified.payload.purpose === "student_code" ? verified.payload.sub ?? null : null;
  } catch {
    return null;
  }
}

export async function hasTrustedStudentDevice(userId: string) {
  const token = (await cookies()).get(trustedStudentDeviceCookieName)?.value;
  if (!token) return false;
  try {
    const verified = await jwtVerify(token, authSecret());
    const deviceToken = typeof verified.payload.deviceToken === "string" ? verified.payload.deviceToken : "";
    if (verified.payload.sub !== userId || !deviceToken) return false;
    const device = await prisma.studentTrustedDevice.findUnique({ where: { tokenHash: hashDeviceToken(deviceToken) } });
    if (!device || device.userId !== userId || device.revokedAt || device.expiresAt < new Date()) return false;
    await prisma.studentTrustedDevice.update({ where: { id: device.id }, data: { lastUsedAt: new Date() } });
    return true;
  } catch {
    return false;
  }
}

export async function trustStudentDevice(user: SafeUser) {
  const deviceToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
  await prisma.studentTrustedDevice.create({
    data: {
      userId: user.id,
      tokenHash: hashDeviceToken(deviceToken),
      deviceLabel: "Trusted browser",
      expiresAt
    }
  });
  const trustedCookie = await new SignJWT({ sub: user.id, purpose: "student_trusted_device", deviceToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(authSecret());
  const cookieStore = await cookies();
  cookieStore.set(trustedStudentDeviceCookieName, trustedCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180
  });
  cookieStore.delete(pendingStudentCookieName);
}
