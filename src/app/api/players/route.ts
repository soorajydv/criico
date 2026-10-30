import { createPlayerController, listPlayersController } from "@/lib/controllers/players.controller";

/** GET /api/players: all players, alphabetical. */
export const GET = listPlayersController;

/** POST /api/players: { name, role, basePrice, matchesPlayed, totalRuns, totalWickets } */
export const POST = createPlayerController;
