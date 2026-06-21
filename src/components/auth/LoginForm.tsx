"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "./PasswordInput";
import { sanitizeCallbackUrl } from "@/lib/utils";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn("credentials", { redirect: false, email, password, callbackUrl });
    setBusy(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(callbackUrl);
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-serif text-3xl text-ink mb-6 text-center">Sign In</h1>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full border border-line rounded py-3 text-sm tap-target flex items-center justify-center gap-2 mb-4"
          >
            <GoogleGIcon />
            Continue with Google
          </button>
          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-line" />
            <span className="text-xs text-bark uppercase tracking-widest2">or</span>
            <span className="flex-1 h-px bg-line" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-sm text-bark text-center mt-6">
        New here?{" "}
        <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-ink underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
