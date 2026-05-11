import bcrypt from "bcryptjs";
import type { SafeUser } from "@/backend/shared/types";
import { prisma } from "@/backend/db/prisma";
import {
  assertRealRegistrationEmail,
  createVerificationToken,
  hashVerificationToken,
  normaliseEmail,
  sendVerificationEmail
} from "@/backend/auth/email-verification";

type DbUser = {
  id: string;
  role: "STUDENT" | "PARENT" | "ADMIN";
  subscriptionTier: "FOUNDATION" | "ALPHA" | "VELOCITY" | "APEX";
  email: string;
  firstName: string;
  lastName: string;
  parentId?: string | null;
  stripeCustomerId?: string | null;
};

export function toSafeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    parentId: user.parentId,
    stripeCustomerId: user.stripeCustomerId
  };
}

export async function findUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toSafeUser(user) : null;
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: normaliseEmail(email) } });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  if (!user.emailVerifiedAt && user.role !== "ADMIN") {
    throw new Error("Please confirm your email before signing in.");
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return toSafeUser(user);
}

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "PARENT";
  parentId?: string;
}) {
  const email = await assertRealRegistrationEmail(input.email);
  if (input.role === "STUDENT") {
    throw new Error("Student accounts must be created or linked by a verified parent or superadmin.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with this email already exists.");

  const { token, tokenHash } = createVerificationToken();
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: input.role,
      subscriptionTier: "FOUNDATION"
    }
  });

  try {
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      }
    });
    await sendVerificationEmail({ email, firstName: user.firstName, token });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    throw error;
  }

  return toSafeUser(user);
}

export async function confirmEmail(token: string) {
  const tokenHash = hashVerificationToken(token);
  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });
  if (!verification || verification.consumedAt || verification.expiresAt < new Date()) {
    throw new Error("This verification link is invalid or has expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() }
    }),
    prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() }
    })
  ]);

  return toSafeUser(verification.user);
}

export async function ensureSuperadmin() {
  const email = normaliseEmail(process.env.SUPERADMIN_EMAIL ?? "admin@grammarforge.local");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return toSafeUser(existing);
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("SUPERADMIN_PASSWORD must be configured with at least 12 characters.");
  }
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      firstName: process.env.SUPERADMIN_FIRST_NAME ?? "Super",
      lastName: process.env.SUPERADMIN_LAST_NAME ?? "Admin",
      role: "ADMIN",
      subscriptionTier: "APEX",
      emailVerifiedAt: new Date()
    }
  });
  return toSafeUser(user);
}
