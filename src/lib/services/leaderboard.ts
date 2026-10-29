import { rankPlayers, type RankedPlayer } from "@/lib/scoring/leaderboard";
import { listPlayers, type PlayerDTO } from "./players";

export type LeaderboardEntry = RankedPlayer<PlayerDTO>;

/**
 * Scores are computed in TypeScript on read rather than stored, so they can
 * never drift from the formula or from the underlying stats.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return rankPlayers(await listPlayers());
}
