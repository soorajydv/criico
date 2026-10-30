import { revalidatePath } from "next/cache";
import { handleApiError, ok, readJson } from "@/lib/api/http";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { createPlayer, getPlayer, listPlayers, updatePlayer } from "@/lib/services/players";

export async function listPlayersController() {
  try {
    await requireSession();
    return ok(await listPlayers());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function createPlayerController(request: Request) {
  try {
    await requireAdmin();
    const player = await createPlayer(await readJson(request));
    revalidatePath("/dashboard", "layout");
    return ok(player, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function getPlayerController(id: string) {
  try {
    await requireSession();
    return ok(await getPlayer(id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function updatePlayerController(request: Request, id: string) {
  try {
    await requireAdmin();
    const player = await updatePlayer(id, await readJson(request));
    revalidatePath("/dashboard", "layout");
    return ok(player);
  } catch (error) {
    return handleApiError(error);
  }
}
