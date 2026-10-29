import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <Card className="p-6">
        <h1 className="text-lg font-semibold text-slate-900">Create an admin account</h1>
        <p className="mt-1 text-sm text-slate-600">Admins can add players, edit stats and record matches.</p>
        <RegisterForm />
      </Card>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-pitch-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
