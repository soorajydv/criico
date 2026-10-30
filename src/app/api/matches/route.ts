import { createMatchController, listMatchesController } from "@/lib/controllers/matches.controller";

/** GET /api/matches: most recent matches first. */
export const GET = listMatchesController;

/**
 * POST /api/matches: record a result and update every player's career stats.
 * Body: {
 *   teamA, teamB, result: "TEAM_A" | "TEAM_B" | "TIE" | "NO_RESULT", playedOn?: "YYYY-MM-DD",
 *   performances: [{ playerId, team: "A" | "B", runs, wickets }]
 * }
 */
export const POST = createMatchController;
