"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/backend/shared/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,33,31,0.18)] transition hover:-translate-y-0.5 hover:bg-teal disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
