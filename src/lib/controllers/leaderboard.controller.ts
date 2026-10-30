import { handleApiError, ok } from "@/lib/api/http";
import { getLeaderboard } from "@/lib/services/leaderboard";

export async function getLeaderboardController() {
  try {
    return ok(await getLeaderboard());
  } catch (error) {
    return handleApiError(error);
  }
}
