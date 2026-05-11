import bcrypt from "bcryptjs";
import type { AdminUserInput, SafeUser } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { store, toSafeUser } from "@/backend/platform/app-store";

const adminId = "user_admin_demo";
const parentId = "user_parent_demo";

type StoredUser = SafeUser & { passwordHash: string };

export async function adminCreateUser(input: AdminUserInput) {
  const data = store();
  const existing = data.users.find((user) => user.email?.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new Error("An account with this email already exists.");

  const user: StoredUser = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password || "Password123!", 10),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    parentId: input.role === "STUDENT" ? input.parentId ?? parentId : null,
    subscriptionTier: input.subscriptionTier
  };
  data.users.push(user);
  return toSafeUser(user);
}

export function adminListUsers() {
  return store().users.map(toSafeUser);
}

export function adminUpdateUser(userId: string, input: Partial<AdminUserInput>) {
  const user = store().users.find((candidate) => candidate.id === userId);
  if (!user) throw new Error("User not found.");
  if (input.email) user.email = input.email.toLowerCase();
  if (input.firstName) user.firstName = input.firstName;
  if (input.lastName) user.lastName = input.lastName;
  if (input.role) user.role = input.role;
  if (input.subscriptionTier) user.subscriptionTier = input.subscriptionTier;
  if ("parentId" in input) user.parentId = input.parentId;
  return toSafeUser(user);
}

export function adminDeleteUser(userId: string) {
  if (userId === adminId) throw new Error("The primary superadmin demo account cannot be deleted.");
  const data = store();
  const before = data.users.length;
  data.users = data.users.filter((user) => user.id !== userId);
  data.exams = data.exams.filter((exam) => exam.studentId !== userId);
  if (data.users.length === before) throw new Error("User not found.");
  return { ok: true };
}
