"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionState } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth/session";
import { createPlayer, updatePlayer } from "@/lib/services/players";

/*
 * Server Actions behind the Add / Edit player forms. The client validates
 * first for instant feedback, but these re-validate everything: a request can
 * always be sent without going through our UI.
 */

export async function createPlayerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const player = await createPlayer(Object.fromEntries(formData));
    revalidatePath("/dashboard", "layout");
    return { status: "success", message: `${player.name} added to the squad`, id: player.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePlayerAction(
  playerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const player = await updatePlayer(playerId, Object.fromEntries(formData));
    revalidatePath("/dashboard", "layout");
    return { status: "success", message: `${player.name} updated`, id: player.id };
  } catch (error) {
    return toActionError(error);
  }
}
