import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create Account — tandh studio" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
