"use client";

import { Save, Trash2, Users } from "lucide-react";
import { Button } from "@/frontend/shared/ui/button";
import type { SafeUser } from "@/backend/shared/types";

type Mutate = (url: string, options: RequestInit, success: string) => Promise<void>;

export function UsersPanel({ users, mutate }: { users: SafeUser[]; mutate: Mutate }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="premium-card overflow-hidden">
        <div className="border-b border-ink/10 p-4">
          <h2 className="text-xl font-black">User administration</h2>
          <p className="text-sm font-semibold text-ink/55">Upgrade plans, change roles, and remove accounts.</p>
        </div>
        <div className="divide-y divide-ink/10">
          {users.map((user) => (
            <form
              key={user.id}
              className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
              action={(formData) => {
                const payload = {
                  firstName: String(formData.get("firstName")),
                  lastName: String(formData.get("lastName")),
                  role: String(formData.get("role")),
                  subscriptionTier: String(formData.get("subscriptionTier"))
                };
                void mutate(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(payload) }, "User updated");
              }}
            >
              <div>
                <p className="text-xs font-black uppercase text-ink/40">{user.email}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input className="field" name="firstName" defaultValue={user.firstName} />
                  <input className="field" name="lastName" defaultValue={user.lastName} />
                </div>
              </div>
              <select className="field" name="role" defaultValue={user.role}>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select className="field" name="subscriptionTier" defaultValue={user.subscriptionTier}>
                <option value="FOUNDATION">Foundation</option>
                <option value="ALPHA">Alpha</option>
                <option value="VELOCITY">Velocity</option>
                <option value="APEX">Apex</option>
              </select>
              <div className="flex gap-2">
                <Button><Save size={16} /> Save</Button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md border border-coral/30 px-3 font-bold text-coral"
                  onClick={() => void mutate(`/api/admin/users/${user.id}`, { method: "DELETE" }, "User deleted")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>

      <form
        className="premium-card p-4"
        action={(formData) => {
          const payload = {
            email: String(formData.get("email")),
            password: String(formData.get("password") || "Password123!"),
            firstName: String(formData.get("firstName")),
            lastName: String(formData.get("lastName")),
            role: String(formData.get("role")),
            subscriptionTier: String(formData.get("subscriptionTier"))
          };
          void mutate("/api/admin/users", { method: "POST", body: JSON.stringify(payload) }, "User created");
        }}
      >
        <h2 className="text-xl font-black">Create user</h2>
        <div className="mt-4 space-y-3">
          <input className="field" name="email" type="email" placeholder="Email" required />
          <input className="field" name="password" type="password" placeholder="Temporary password" />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" name="firstName" placeholder="First name" required />
            <input className="field" name="lastName" placeholder="Last name" required />
          </div>
          <select className="field" name="role" defaultValue="STUDENT">
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select className="field" name="subscriptionTier" defaultValue="FOUNDATION">
            <option value="FOUNDATION">Foundation</option>
            <option value="ALPHA">Alpha</option>
            <option value="VELOCITY">Velocity</option>
            <option value="APEX">Apex</option>
          </select>
          <Button className="w-full"><Users size={16} /> Create account</Button>
        </div>
      </form>
    </div>
  );
}
