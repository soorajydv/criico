import { revalidatePath } from "next/cache";
import { handleApiError, ok, readJson } from "@/lib/api/http";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { listMatches, recordMatch } from "@/lib/services/matches";

/** GET /api/matches: most recent matches first. */
export async function GET() {
  try {
    await requireSession();
    return ok(await listMatches());
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/matches: record a result and update every player's career stats.
 * Body: {
 *   teamA, teamB, result: "TEAM_A" | "TEAM_B" | "TIE" | "NO_RESULT", playedOn?: "YYYY-MM-DD",
 *   performances: [{ playerId, team: "A" | "B", runs, wickets }]
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const match = await recordMatch(await readJson(request), session.sub);
    revalidatePath("/dashboard", "layout");
    return ok(match, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
