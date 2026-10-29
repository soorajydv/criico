import { handleApiError, ok } from "@/lib/api/http";
import { getLeaderboard } from "@/lib/services/leaderboard";

export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard: players sorted by Impact Score, highest first.
 * Public and read-only, so it can be embedded on a club website.
 */
export async function GET() {
  try {
    return ok(await getLeaderboard());
  } catch (error) {
    return handleApiError(error);
  }
}
