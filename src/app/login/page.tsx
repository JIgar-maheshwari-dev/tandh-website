import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleAuthConfigured } from "@/lib/auth";

export const metadata = { title: "Sign In — tandh studio" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16">
      <Suspense>
        <LoginForm googleEnabled={isGoogleAuthConfigured()} />
      </Suspense>
    </div>
  );
}
