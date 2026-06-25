import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { findUserByEmail, upsertGoogleUser } from "./userStore";

/**
 * NextAuth requires a stable secret to encrypt session JWTs. Without
 * NEXTAUTH_SECRET set, it silently generates a NEW random secret every
 * time the process starts — which means every existing logged-in
 * session (cookie) instantly fails to decrypt on the next restart,
 * producing exactly the JWT_SESSION_ERROR / decryption-failed errors
 * you saw in the logs. That's a reliability problem in dev and a real
 * security smell if it ever happened in production.
 *
 * Setting NEXTAUTH_SECRET in .env.local is still the correct fix and
 * is required before any real deployment — but to stop local dev from
 * breaking every time the server restarts (which happens automatically
 * whenever .env.local itself is edited), this persists a generated
 * secret to disk the first time and reuses it afterward.
 */
function getOrCreateDevSecret(): string {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;

  const dataDir = path.join(process.cwd(), "data");
  const secretPath = path.join(dataDir, ".nextauth-secret");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, "utf-8").trim();
  }

  const generated = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(secretPath, generated, "utf-8");
  console.warn(
    "\n[tandh studio] NEXTAUTH_SECRET is not set in .env.local — generated a " +
      "persistent fallback secret at data/.nextauth-secret for local development.\n" +
      "Set NEXTAUTH_SECRET yourself (openssl rand -base64 32) before deploying " +
      "anywhere real — this fallback file should never be relied on in production.\n"
  );
  return generated;
}

/**
 * This is the actual fix for "login works on the laptop at localhost,
 * but fails on the phone at the LAN IP." Internally, next-auth decides
 * which URL to anchor callbacks/redirects to via `detectOrigin()`:
 * it uses the incoming request's Host header ONLY if `AUTH_TRUST_HOST`
 * (or `VERCEL`) is set — otherwise it always falls back to the single
 * fixed `NEXTAUTH_URL` value, regardless of which host the request
 * actually came in on. With NEXTAUTH_URL pinned to localhost, every
 * request from a different device/IP was being silently anchored back
 * to "localhost" — which means nothing on your phone, since "localhost"
 * there means the phone itself.
 *
 * Setting this here means you don't need to remember to add it to
 * .env.local yourself, but it's still listed there for visibility.
 *
 * Security note: this makes next-auth trust whatever Host header a
 * request arrives with. That's the right tradeoff for local LAN
 * testing across devices. If you later put this behind a reverse proxy
 * on a real domain, make sure that proxy passes through the genuine
 * client Host header rather than letting arbitrary client-supplied
 * Host headers through unchecked — the same caution that applies to
 * any app trusting Host/X-Forwarded-Host.
 */
if (process.env.AUTH_TRUST_HOST === undefined) {
  process.env.AUTH_TRUST_HOST = "true";
}

const providers: AuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await findUserByEmail(credentials.email);
      if (!user || !user.passwordHash) return null;
      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;
      return { id: user.id, name: user.name ?? user.email, email: user.email };
    },
  }),
];

// Google sign-in is only offered if credentials are actually configured —
// otherwise NextAuth would error out trying to use empty strings.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: AuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials sign-in already went through authorize() above and
      // the user already exists by the time we get here. Google sign-in
      // needs its first-time-seen local user record created here.
      if (account?.provider === "google" && user.email) {
        await upsertGoogleUser({ name: user.name ?? null, email: user.email });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (account?.provider === "google" && token.email) {
        const local = await findUserByEmail(token.email);
        if (local) token.id = local.id;
      } else if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
      }
      return session;
    },
  },
  secret: getOrCreateDevSecret(),
};

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
