import { connectDB } from "@/lib/db/connect";
import { Player, type PlayerDoc } from "@/lib/models/player";
import { NotFoundError } from "@/lib/errors";
import type { PlayerRole } from "@/lib/players/roles";
import { isObjectId } from "@/lib/validation/common";
import { playerSchema, playerUpdateSchema } from "@/lib/validation/player";

/** Plain, serialisable player shape returned by the API and passed to client components. */
export interface PlayerDTO {
  id: string;
  name: string;
  role: PlayerRole;
  basePrice: number;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
  createdAt: string;
  updatedAt: string;
}

export function toPlayerDTO(doc: PlayerDoc): PlayerDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    role: doc.role,
    basePrice: doc.basePrice,
    matchesPlayed: doc.matchesPlayed,
    totalRuns: doc.totalRuns,
    totalWickets: doc.totalWickets,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function assertPlayerId(id: string): void {
  // A malformed id can never match, so answer 404 rather than leak a CastError.
  if (!isObjectId(id)) throw new NotFoundError("Player not found");
}

export async function listPlayers(): Promise<PlayerDTO[]> {
  await connectDB();
  const docs = await Player.find().sort({ name: 1 }).lean<PlayerDoc[]>();
  return docs.map(toPlayerDTO);
}

export async function getPlayer(id: string): Promise<PlayerDTO> {
  assertPlayerId(id);
  await connectDB();
  const doc = await Player.findById(id).lean<PlayerDoc>();
  if (!doc) throw new NotFoundError("Player not found");
  return toPlayerDTO(doc);
}

/** Throws a ZodError for invalid input; callers map it to a 400 or form errors. */
export async function createPlayer(input: unknown): Promise<PlayerDTO> {
  const data = playerSchema.parse(input);
  await connectDB();
  const doc = await Player.create(data);
  return toPlayerDTO(doc.toObject());
}

/**
 * Applies a partial update. The merged player is re-validated as a whole so
 * cross-field rules (e.g. 0 matches implies 0 runs) still hold.
 */
export async function updatePlayer(id: string, input: unknown): Promise<PlayerDTO> {
  assertPlayerId(id);
  const changes = playerUpdateSchema.parse(input);
  await connectDB();

  const existing = await Player.findById(id).lean<PlayerDoc>();
  if (!existing) throw new NotFoundError("Player not found");

  const merged = playerSchema.parse({
    name: existing.name,
    role: existing.role,
    basePrice: existing.basePrice,
    matchesPlayed: existing.matchesPlayed,
    totalRuns: existing.totalRuns,
    totalWickets: existing.totalWickets,
    ...changes,
  });

  const updated = await Player.findByIdAndUpdate(id, { $set: merged }, {
    returnDocument: "after",
    runValidators: true,
  }).lean<PlayerDoc>();
  if (!updated) throw new NotFoundError("Player not found");
  return toPlayerDTO(updated);
}
