import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { SafeUser } from "@/backend/shared/types";
import { prisma } from "@/backend/db/prisma";
import { hasTrustedStudentDevice } from "@/backend/auth/student-device";
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
  email?: string | null;
  username?: string | null;
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
    username: user.username,
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

export async function listStudentsFor(parentUserId: string) {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      parentId: parentUserId
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
  });
  return students.map(toSafeUser);
}

export async function verifyUser(identifier: string, password: string) {
  const normalized = identifier.includes("@") ? normaliseEmail(identifier) : identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: identifier.includes("@") ? { email: normalized } : { username: normalized }
  });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  if (user.role === "STUDENT") {
    if (await hasTrustedStudentDevice(user.id)) {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return { status: "AUTHENTICATED" as const, user: toSafeUser(user) };
    }
    return { status: "CODE_REQUIRED" as const, user: toSafeUser(user) };
  }
  if (!user.emailVerifiedAt && user.role !== "ADMIN") {
    throw new Error("Please confirm your email before signing in.");
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { status: "AUTHENTICATED" as const, user: toSafeUser(user) };
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

export async function createLinkedStudent(input: {
  parentId: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const parent = await prisma.user.findUnique({ where: { id: input.parentId } });
  if (!parent || parent.role !== "PARENT") throw new Error("Only a verified parent can create a student profile.");
  const username = normaliseStudentUsername(input.username);
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new Error("A student with this username already exists.");

  const accessCode = createStudentAccessCode();
  const student = await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(input.password, 12),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: "STUDENT",
      parentId: input.parentId,
      subscriptionTier: parent.subscriptionTier,
      studentAccessCodeHash: await bcrypt.hash(accessCode, 12),
      studentAccessCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });

  return { student: toSafeUser(student), accessCode };
}

function normaliseStudentUsername(username: string) {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (normalized.length < 4 || normalized.length > 40) throw new Error("Student username must be 4-40 characters and use letters, numbers, dot, dash, or underscore.");
  return normalized;
}

function createStudentAccessCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function verifyStudentAccessCode(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "STUDENT" || !user.studentAccessCodeHash || !user.studentAccessCodeExpiresAt) return null;
  if (user.studentAccessCodeExpiresAt < new Date()) throw new Error("The student access code has expired. Please ask the parent to create a new code.");
  const ok = await bcrypt.compare(code, user.studentAccessCodeHash);
  if (!ok) return null;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      studentAccessCodeHash: null,
      studentAccessCodeExpiresAt: null,
      studentAccessActivatedAt: user.studentAccessActivatedAt ?? new Date(),
      lastLoginAt: new Date()
    }
  });
  return toSafeUser(updated);
}

export async function generateStudentAccessCode(input: { parentId: string; studentId: string }) {
  const student = await prisma.user.findFirst({
    where: {
      id: input.studentId,
      parentId: input.parentId,
      role: "STUDENT"
    }
  });
  if (!student) throw new Error("Student not found for this parent account.");
  const accessCode = createStudentAccessCode();
  await prisma.user.update({
    where: { id: student.id },
    data: {
      studentAccessCodeHash: await bcrypt.hash(accessCode, 12),
      studentAccessCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });
  return accessCode;
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
