import { model, models, Schema, type Model, type Types } from "mongoose";
import { PLAYER_ROLES, type PlayerRole } from "@/lib/players/roles";

export interface PlayerDoc {
  _id: Types.ObjectId;
  name: string;
  role: PlayerRole;
  /** Whole Nepalese rupees; integers avoid floating point money. */
  basePrice: number;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
  createdAt: Date;
  updatedAt: Date;
}

const nonNegativeInt = (label: string) => ({
  type: Number,
  required: true,
  default: 0,
  min: [0, `${label} cannot be negative`] as const,
  validate: { validator: Number.isInteger, message: `${label} must be a whole number` },
});

const playerSchema = new Schema<PlayerDoc>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    role: { type: String, enum: PLAYER_ROLES, required: true },
    basePrice: nonNegativeInt("Base Price"),
    matchesPlayed: nonNegativeInt("Matches Played"),
    totalRuns: nonNegativeInt("Total Runs"),
    totalWickets: nonNegativeInt("Total Wickets"),
  },
  { timestamps: true },
);

playerSchema.index({ name: 1 });

export const Player: Model<PlayerDoc> =
  (models.Player as Model<PlayerDoc> | undefined) ?? model<PlayerDoc>("Player", playerSchema);
