"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/backend/shared/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-teal bg-teal px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:border-[#4338ca] hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
