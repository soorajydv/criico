import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;

  return (
    <>
      <Card className="p-6">
        <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Manage players, matches and the leaderboard.</p>
        <LoginForm from={from} />
      </Card>
      <p className="mt-4 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-medium text-pitch-700 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-6 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center text-xs text-slate-500">
        Demo admin: <span className="font-mono">admin@criico.dev</span> / <span className="font-mono">Criico@2026</span>
      </p>
    </>
  );
}
