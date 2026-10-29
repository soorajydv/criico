import { revalidatePath } from "next/cache";
import { handleApiError, ok, readJson } from "@/lib/api/http";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { getPlayer, updatePlayer } from "@/lib/services/players";

type Context = { params: Promise<{ id: string }> };

/** GET /api/players/:id */
export async function GET(_request: Request, { params }: Context) {
  try {
    await requireSession();
    const { id } = await params;
    return ok(await getPlayer(id));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/players/:id: update a player's details and/or stats.
 * Any subset of fields may be sent, e.g. { "totalRuns": 812 }.
 */
export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const player = await updatePlayer(id, await readJson(request));
    revalidatePath("/dashboard", "layout");
    return ok(player);
  } catch (error) {
    return handleApiError(error);
  }
}
