import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Match, type MatchDoc } from "@/lib/models/match";
import { Player, type PlayerDoc } from "@/lib/models/player";
import { BadRequestError } from "@/lib/errors";
import { matchSchema, type MatchResult, type TeamSide } from "@/lib/validation/match";

export interface PerformanceDTO {
  playerId: string;
  playerName: string;
  team: TeamSide;
  runs: number;
  wickets: number;
}

export interface MatchDTO {
  id: string;
  teamA: string;
  teamB: string;
  result: MatchResult;
  playedOn: string;
  performances: PerformanceDTO[];
  createdAt: string;
}

export function toMatchDTO(doc: MatchDoc): MatchDTO {
  return {
    id: doc._id.toString(),
    teamA: doc.teamA,
    teamB: doc.teamB,
    result: doc.result,
    playedOn: doc.playedOn.toISOString().slice(0, 10),
    performances: doc.performances.map((p) => ({
      playerId: p.player.toString(),
      playerName: p.playerName,
      team: p.team,
      runs: p.runs,
      wickets: p.wickets,
    })),
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listMatches(limit = 50): Promise<MatchDTO[]> {
  await connectDB();
  const docs = await Match.find()
    .sort({ playedOn: -1, createdAt: -1 })
    .limit(limit)
    .lean<MatchDoc[]>();
  return docs.map(toMatchDTO);
}

export async function countMatches(): Promise<number> {
  await connectDB();
  return Match.countDocuments();
}

/** Matches a player appeared in, newest first. */
export async function listMatchesForPlayer(playerId: string, limit = 20): Promise<MatchDTO[]> {
  if (!Types.ObjectId.isValid(playerId)) return [];
  await connectDB();
  const docs = await Match.find({ "performances.player": new Types.ObjectId(playerId) })
    .sort({ playedOn: -1, createdAt: -1 })
    .limit(limit)
    .lean<MatchDoc[]>();
  return docs.map(toMatchDTO);
}

/**
 * Records a match and folds every performance into the players' career
 * totals. Both writes happen in one transaction: either the match and all
 * stat increments are saved, or none of them are.
 */
export async function recordMatch(input: unknown, recordedById: string | null): Promise<MatchDTO> {
  const data = matchSchema.parse(input);
  await connectDB();

  const playerIds = data.performances.map((p) => new Types.ObjectId(p.playerId));
  const session = await mongoose.startSession();

  try {
    let created: MatchDoc | undefined;

    // withTransaction retries on transient errors, so the callback must be
    // idempotent: it only assigns `created` and never mutates outer state.
    await session.withTransaction(async () => {
      const found = await Player.find({ _id: { $in: playerIds } }, { name: 1 })
        .session(session)
        .lean<Pick<PlayerDoc, "_id" | "name">[]>();

      const names = new Map(found.map((p) => [p._id.toString(), p.name]));
      const missing = data.performances.filter((p) => !names.has(p.playerId.toLowerCase()));
      if (missing.length > 0) {
        throw new BadRequestError("Some players in this match do not exist", {
          missingPlayerIds: missing.map((p) => p.playerId),
        });
      }

      const [match] = await Match.create(
        [
          {
            teamA: data.teamA,
            teamB: data.teamB,
            result: data.result,
            playedOn: data.playedOn ? new Date(`${data.playedOn}T00:00:00Z`) : new Date(),
            recordedBy: recordedById ? new Types.ObjectId(recordedById) : null,
            performances: data.performances.map((p) => ({
              player: new Types.ObjectId(p.playerId),
              playerName: names.get(p.playerId.toLowerCase())!,
              team: p.team,
              runs: p.runs,
              wickets: p.wickets,
            })),
          },
        ],
        { session },
      );

      await Player.bulkWrite(
        data.performances.map((p) => ({
          updateOne: {
            filter: { _id: new Types.ObjectId(p.playerId) },
            update: { $inc: { matchesPlayed: 1, totalRuns: p.runs, totalWickets: p.wickets } },
          },
        })),
        { session },
      );

      created = match.toObject();
    });

    return toMatchDTO(created!);
  } finally {
    await session.endSession();
  }
}
