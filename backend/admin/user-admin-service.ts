import bcrypt from "bcryptjs";
import type { AdminUserInput, SafeUser } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { store, toSafeUser } from "@/backend/platform/app-store";

const adminId = "user_admin_demo";
type StoredUser = SafeUser & { passwordHash: string };

export async function adminCreateUser(input: AdminUserInput) {
  const data = store();
  const email = input.email?.trim().toLowerCase();
  const username = input.username?.trim().toLowerCase();
  if (input.role === "STUDENT" && !input.parentId) throw new Error("A student must be linked to a parent.");
  if (input.role === "STUDENT" && !username) throw new Error("Student username is required.");
  if (input.role !== "STUDENT" && !email) throw new Error("Email is required for parent and admin accounts.");
  if (input.parentId) {
    const parent = data.users.find((user) => user.id === input.parentId && user.role === "PARENT");
    if (!parent) throw new Error("Selected parent was not found.");
  }
  const existing = data.users.find((user) => (email && user.email?.toLowerCase() === email) || (username && user.username?.toLowerCase() === username));
  if (existing) throw new Error("An account with this email or username already exists.");

  const user: StoredUser = {
    id: uid("user"),
    email: input.role === "STUDENT" ? null : email,
    username: input.role === "STUDENT" ? username : null,
    passwordHash: await bcrypt.hash(input.password || "Password123!", 10),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    parentId: input.role === "STUDENT" ? input.parentId : null,
    subscriptionTier: input.subscriptionTier ?? "FOUNDATION"
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
  if (input.role) {
    if (input.role === "STUDENT" && !("parentId" in input) && !user.parentId) throw new Error("A student must be linked to a parent.");
    user.role = input.role;
  }
  if (input.subscriptionTier) user.subscriptionTier = input.subscriptionTier;
  if ("parentId" in input) {
    if (user.role === "STUDENT" && !input.parentId) throw new Error("A student must be linked to a parent.");
    if (input.parentId) {
      const parent = store().users.find((candidate) => candidate.id === input.parentId && candidate.role === "PARENT");
      if (!parent) throw new Error("Selected parent was not found.");
    }
    user.parentId = input.parentId;
  }
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
