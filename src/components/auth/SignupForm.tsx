"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "./PasswordInput";
import { sanitizeCallbackUrl } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        setBusy(false);
        return;
      }
      const signInRes = await signIn("credentials", { redirect: false, email, password, callbackUrl });
      setBusy(false);
      if (signInRes?.error) {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      router.push(callbackUrl);
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-serif text-3xl text-ink mb-6 text-center">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest2 text-bark">Full Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-line rounded px-3 py-2.5 bg-weave focus:border-indigo"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest2 text-bark">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-line rounded px-3 py-2.5 bg-weave focus:border-indigo"
          />
        </label>
        <div>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <span className="text-xs text-bark">At least 8 characters.</span>
        </div>

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-bark text-center mt-6">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-ink underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
