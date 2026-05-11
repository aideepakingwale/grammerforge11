import bcrypt from "bcryptjs";
import { store, toSafeUser } from "@/backend/platform/app-store";

export async function verifyUser(email: string, password: string) {
  const user = store().users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? toSafeUser(user) : null;
}

export function findUser(id: string) {
  const user = store().users.find((candidate) => candidate.id === id);
  return user ? toSafeUser(user) : null;
}

export function listStudentsFor(parentUserId: string) {
  return store()
    .users.filter((user) => user.parentId === parentUserId)
    .map(toSafeUser);
}

