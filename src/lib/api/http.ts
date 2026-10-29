import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { toFieldErrors } from "@/lib/validation/common";

export interface ApiErrorBody {
  error: {
    message: string;
    fieldErrors?: Record<string, string | undefined>;
    details?: Record<string, unknown>;
  };
}

export function ok<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ data }, { status: init?.status ?? 200 });
}

export function fail(status: number, message: string, extra?: Omit<ApiErrorBody["error"], "message">) {
  return NextResponse.json<ApiErrorBody>({ error: { message, ...extra } }, { status });
}

/**
 * Parses a JSON request body. Requiring `application/json` also blocks
 * cross-site HTML form posts, which can only send form encodings without a
 * CORS preflight (defence in depth on top of SameSite cookies).
 */
export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AppError("Content-Type must be application/json", 415);
  }
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON", 400);
  }
}

/** Maps any thrown error to a consistent JSON error response. */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(400, error.issues[0]?.message ?? "Invalid input", {
      fieldErrors: toFieldErrors(error),
    });
  }
  if (error instanceof AppError) {
    return fail(error.status, error.message, error.details ? { details: error.details } : undefined);
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const first = Object.values(error.errors)[0];
    return fail(400, first?.message ?? "Invalid input");
  }

  console.error("[api] unexpected error", error);
  return fail(500, "Something went wrong. Please try again.");
}
