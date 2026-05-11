"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role] = useState<"PARENT">("PARENT");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData, authMode = mode) {
    setLoading(true);
    setError("");
    setNotice("");
    const payload = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      firstName: String(formData.get("firstName") || "Demo"),
      lastName: String(formData.get("lastName") || "User"),
      role
    };

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      const json = text ? JSON.parse(text) : {};
      if (!response.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      if (authMode === "register") {
        setNotice(json.message ?? "Please check your email to confirm your account.");
        setMode("login");
        return;
      }
      router.push(json.user.role === "ADMIN" ? "/admin" : json.user.role === "PARENT" ? "/dashboard/parent" : "/dashboard/student");
    } catch {
      setError("Could not reach the app server. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="auth" className="surface w-full max-w-md rounded-lg p-5">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-teal p-2 text-white shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black">Sign in</h2>
            <p className="text-sm text-ink/60">Create a verified parent account or sign in.</p>
          </div>
        </div>
        <div className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-extrabold text-gold">11+</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-md border border-line bg-paper p-1">
        <button type="button" className={mode === "login" ? "rounded bg-white p-2.5 text-sm font-bold shadow-sm" : "p-2.5 text-sm font-bold text-ink/55"} onClick={() => setMode("login")}>
          Login
        </button>
        <button type="button" className={mode === "register" ? "rounded bg-white p-2.5 text-sm font-bold shadow-sm" : "p-2.5 text-sm font-bold text-ink/55"} onClick={() => setMode("register")}>
          Register
        </button>
      </div>

      <form action={submit} className="space-y-3">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <input className="field" name="firstName" placeholder="First name" required />
            <input className="field" name="lastName" placeholder="Last name" required />
          </div>
        )}
        <input className="field" name="email" placeholder="Email" type="email" required />
        <input className="field" name="password" placeholder="Password" type="password" required />
        {mode === "register" && (
          <input type="hidden" name="role" value={role} />
        )}
        {mode === "register" && (
          <p className="rounded-md bg-skysoft p-3 text-sm font-semibold text-teal">
            Public registration is for parent or guardian accounts. Student accounts are linked after a parent email is verified.
          </p>
        )}
        {error && <p className="rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">{error}</p>}
        {notice && <p className="rounded-md bg-teal/10 p-3 text-sm font-semibold text-teal">{notice}</p>}
        <Button className="w-full" disabled={loading}>
          {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
          {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          <ArrowRight size={18} />
        </Button>
      </form>

      <div className="mt-5 rounded-md border border-line bg-skysoft p-3 text-sm text-ink">
        <div className="flex items-center gap-2 font-bold text-teal">
          <GraduationCap size={24} />
          Account security
        </div>
        <p className="mt-1 text-ink/65">New accounts must confirm a real email address before sign-in is enabled.</p>
      </div>
    </section>
  );
}
