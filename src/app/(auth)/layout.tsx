import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          PresentAI
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
