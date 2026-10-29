import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { firstErrorMessage, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors }
  | { status: "success"; message: string; id?: string };

export const IDLE: ActionState = { status: "idle" };

/** Turns a thrown error into state a form can render and toast. */
export function toActionError(error: unknown): ActionState {
  if (error instanceof ZodError) {
    return { status: "error", message: firstErrorMessage(error), fieldErrors: toFieldErrors(error) };
  }
  if (error instanceof AppError) {
    return { status: "error", message: error.message };
  }
  console.error("[action] unexpected error", error);
  return { status: "error", message: "Something went wrong. Please try again." };
}
