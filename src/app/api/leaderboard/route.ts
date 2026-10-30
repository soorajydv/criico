import { getLeaderboardController } from "@/lib/controllers/leaderboard.controller";

export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard: players sorted by Impact Score, highest first.
 * Public and read-only, so it can be embedded on a club website.
 */
export const GET = getLeaderboardController;
