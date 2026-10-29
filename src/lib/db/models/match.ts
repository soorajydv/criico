import { model, models, Schema, type Model, type Types } from "mongoose";
import {
  MATCH_RESULTS,
  MAX_RUNS_PER_INNINGS,
  MAX_WICKETS_PER_SIDE,
  TEAM_SIDES,
  type MatchResult,
  type TeamSide,
} from "@/lib/validation/match";

export interface PerformanceDoc {
  player: Types.ObjectId;
  /** Snapshot so the scorecard still reads correctly if the player is renamed. */
  playerName: string;
  team: TeamSide;
  runs: number;
  wickets: number;
}

export interface MatchDoc {
  _id: Types.ObjectId;
  teamA: string;
  teamB: string;
  result: MatchResult;
  playedOn: Date;
  recordedBy: Types.ObjectId | null;
  performances: PerformanceDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const performanceSchema = new Schema<PerformanceDoc>(
  {
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    playerName: { type: String, required: true },
    team: { type: String, enum: TEAM_SIDES, required: true },
    runs: { type: Number, required: true, min: 0, max: MAX_RUNS_PER_INNINGS },
    wickets: { type: Number, required: true, min: 0, max: MAX_WICKETS_PER_SIDE },
  },
  { _id: false },
);

const matchSchema = new Schema<MatchDoc>(
  {
    teamA: { type: String, required: true, trim: true, maxlength: 60 },
    teamB: { type: String, required: true, trim: true, maxlength: 60 },
    result: { type: String, enum: MATCH_RESULTS, required: true },
    playedOn: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Embedded: a scorecard is always read and written together with its match.
    performances: { type: [performanceSchema], required: true },
  },
  { timestamps: true },
);

matchSchema.index({ playedOn: -1, createdAt: -1 });
matchSchema.index({ "performances.player": 1 });

export const Match: Model<MatchDoc> =
  (models.Match as Model<MatchDoc> | undefined) ?? model<MatchDoc>("Match", matchSchema);
