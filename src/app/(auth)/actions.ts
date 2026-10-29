"use server";

import { redirect } from "next/navigation";
import { toActionError, type ActionState } from "@/lib/actions";
import { endSession, startSession } from "@/lib/auth/session";
import { registerUser } from "@/lib/services/auth";

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await registerUser(Object.fromEntries(formData));
    await startSession(user);
  } catch (error) {
    return toActionError(error);
  }
  // redirect() throws, so it must sit outside the try/catch above.
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}
