import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Start practicing your presentations today.
        </p>
      </div>
      <SignupForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
