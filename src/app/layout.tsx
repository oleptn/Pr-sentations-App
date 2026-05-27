import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "PresentAI — AI presentation practice coach",
  description:
    "Practice presentations alone and get specific, actionable feedback from an AI coach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
