"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink shadow-sm transition hover:border-teal hover:text-teal"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
      }}
    >
      <LogOut size={16} /> Sign out
    </button>
  );
}
