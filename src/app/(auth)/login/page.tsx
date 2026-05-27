import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue practicing.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
