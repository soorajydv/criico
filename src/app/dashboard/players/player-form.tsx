"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, ButtonLink, Card, Field, Input, Select } from "@/components/ui";
import { IDLE, type ActionState } from "@/lib/actions";
import { PLAYER_ROLE_LABELS, PLAYER_ROLES } from "@/lib/players/roles";
import { calculateImpactScore } from "@/lib/scoring/impact-score";
import type { PlayerDTO } from "@/lib/services/players";
import { firstErrorMessage, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { playerSchema } from "@/lib/validation/player";
import { formatScore } from "@/lib/format";

type PlayerFormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const NUMBER_FIELDS = [
  { name: "basePrice", label: "Base Price (NPR)", hint: "Whole Nepalese rupees" },
  { name: "matchesPlayed", label: "Matches Played" },
  { name: "totalRuns", label: "Total Runs" },
  { name: "totalWickets", label: "Total Wickets" },
] as const;

export function PlayerForm({ action, player }: { action: PlayerFormAction; player?: PlayerDTO }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<number | null>(() => (player ? calculateImpactScore(player) : null));

  useEffect(() => {
    if (state.status === "error") {
      setErrors(state.fieldErrors ?? {});
      toast.error(state.message);
    } else if (state.status === "success") {
      toast.success(state.message);
      router.push(state.id ? `/dashboard/players/${state.id}` : "/dashboard/players");
    }
  }, [state, router]);

  function updatePreview(form: HTMLFormElement) {
    const parsed = playerSchema.safeParse(Object.fromEntries(new FormData(form)));
    setPreview(parsed.success ? calculateImpactScore(parsed.data) : null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = playerSchema.safeParse(Object.fromEntries(formData));

    // Same schema as the server. A negative Total Runs (or any other invalid
    // value) is stopped here and surfaced as a toast plus an inline error.
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      toast.error(firstErrorMessage(parsed.error));
      return;
    }

    setErrors({});
    // Dispatching manually (instead of <form action>) stops React 19 from
    // auto-resetting the form, so a server-side error keeps what was typed.
    startTransition(() => dispatch(formData));
  }

  function preventNegativeInput(event: FormEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    const nextErrors = { ...errors };
    if (value && !/^\d+$/.test(value)) {
      nextErrors[name] = "Only non-negative whole numbers are allowed";
    } else if (nextErrors[name] === "Only non-negative whole numbers are allowed") {
      delete nextErrors[name];
    }
    setErrors(nextErrors);
  }

  return (
    // noValidate: native min/required checks would block submission silently
    // with a browser tooltip, so our toast would never show.
    <form onSubmit={handleSubmit} onChange={(e) => updatePreview(e.currentTarget)} noValidate>
      <Card className="p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" name="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={player?.name} invalid={!!errors.name} autoComplete="off" minLength={2} maxLength={80} required />
          </Field>
          <Field label="Role" name="role" error={errors.role}>
            <Select id="role" name="role" defaultValue={player?.role ?? ""} invalid={!!errors.role} required>
              <option value="" disabled>
                Select a role
              </option>
              {PLAYER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {PLAYER_ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>
          {NUMBER_FIELDS.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              name={field.name}
              error={errors[field.name]}
              hint={"hint" in field ? field.hint : undefined}
            >
              <Input
                id={field.name}
                name={field.name}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                step={1}
                min={0}
                max={field.name === "basePrice" ? 1_000_000_000 : field.name === "matchesPlayed" ? 10_000 : field.name === "totalRuns" ? 1_000_000 : 100_000}
                required
                defaultValue={player?.[field.name] ?? 0}
                onInput={preventNegativeInput}
                invalid={!!errors[field.name]}
              />
            </Field>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-600">
            Impact Score preview:{" "}
            <span className="font-semibold tabular-nums text-slate-900">
              {preview === null ? "—" : formatScore(preview)}
            </span>
          </p>
          <div className="flex gap-2">
            <ButtonLink href={player ? `/dashboard/players/${player.id}` : "/dashboard/players"} variant="secondary">
              Cancel
            </ButtonLink>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : player ? "Save changes" : "Add player"}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
