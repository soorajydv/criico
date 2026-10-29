import { revalidatePath } from "next/cache";
import { handleApiError, ok, readJson } from "@/lib/api/http";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { createPlayer, listPlayers } from "@/lib/services/players";

/** GET /api/players: all players, alphabetical. */
export async function GET() {
  try {
    await requireSession();
    return ok(await listPlayers());
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/players: { name, role, basePrice, matchesPlayed, totalRuns, totalWickets } */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const player = await createPlayer(await readJson(request));
    revalidatePath("/dashboard", "layout");
    return ok(player, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
