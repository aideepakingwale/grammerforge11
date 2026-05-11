import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function normaliseAnswer(value: string | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function subjectLabel(subject: string) {
  return subject
    .replace("NON_VERBAL_REASONING", "Non-Verbal Reasoning")
    .replace("MATHS", "Maths")
    .replace("ENGLISH", "English")
    .replace("VERBAL_REASONING", "Verbal Reasoning")
    .replaceAll("_", " ");
}

export function tierRank(tier: string) {
  return tier === "APEX" ? 4 : tier === "VELOCITY" ? 3 : tier === "ALPHA" ? 2 : 1;
}
