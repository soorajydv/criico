import { z } from "zod";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isObjectId(value: string): boolean {
  return OBJECT_ID_PATTERN.test(value);
}

export const objectIdSchema = (message: string) =>
  z.string({ error: message }).regex(OBJECT_ID_PATTERN, message);

/**
 * A whole, non-negative number that may arrive as a string (FormData) or a
 * number (JSON). Unlike `z.coerce.number()`, this does not turn `null`,
 * `true` or `""` into 0/1, so missing or junk input is reported, not stored.
 */
export function wholeNumber(label: string, max: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    },
    z
      .number({
        error: (issue) =>
          issue.input === undefined ? `${label} is required` : `${label} must be a number`,
      })
      .int(`${label} must be a whole number`)
      .min(0, `${label} cannot be negative`)
      .max(max, `${label} cannot exceed ${max.toLocaleString("en-IN")}`),
  );
}

export type FieldErrors = Partial<Record<string, string>>;

/** First message per top-level field, for inline form errors. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

/** The single most useful message to show in a toast. */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
