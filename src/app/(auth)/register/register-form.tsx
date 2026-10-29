"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { IDLE } from "@/lib/actions";
import { registerSchema } from "@/lib/validation/auth";
import { firstErrorMessage, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { registerAction } from "../actions";

export function RegisterForm() {
  const [state, dispatch, pending] = useActionState(registerAction, IDLE);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  const errors = { ...(state.status === "error" ? state.fieldErrors : undefined), ...clientErrors };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      setClientErrors(toFieldErrors(parsed.error));
      toast.error(firstErrorMessage(parsed.error));
      return;
    }
    setClientErrors({});
    // Dispatching manually (instead of <form action>) stops React 19 from
    // resetting the form, so a server-side error does not wipe the inputs.
    startTransition(() => dispatch(formData));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      <Field label="Name" name="name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" minLength={2} maxLength={80} invalid={!!errors.name} required />
      </Field>
      <Field label="Email" name="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" invalid={!!errors.email} required />
      </Field>
      <Field label="Password" name="password" error={errors.password} hint="At least 8 characters with a letter and a number">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} invalid={!!errors.password} required />
      </Field>
      <Field label="Confirm password" name="confirmPassword" error={errors.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          invalid={!!errors.confirmPassword}
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
