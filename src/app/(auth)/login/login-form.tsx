"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { loginSchema } from "@/lib/validation/auth";

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(body?.error?.message ?? "Could not sign in");
        setPending(false);
        return;
      }

      toast.success(`Welcome back, ${body.data.user.name}`);
      // The HTTP-only cookie is already set; refresh so server components see it.
      router.replace(safeRedirectPath(from));
      router.refresh();
    } catch {
      toast.error("Network error. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      <Field label="Email" name="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" invalid={!!errors.email} required />
      </Field>
      <Field label="Password" name="password" error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
