import { getPlayerController, updatePlayerController } from "@/lib/controllers/players.controller";

type Context = { params: Promise<{ id: string }> };

/** GET /api/players/:id */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  return getPlayerController(id);
}

/**
 * PUT /api/players/:id: update a player's details and/or stats.
 * Any subset of fields may be sent, e.g. { "totalRuns": 812 }.
 */
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  return updatePlayerController(request, id);
}
