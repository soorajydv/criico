import { z } from "zod";
import { PLAYER_ROLES } from "@/lib/players/roles";
import { wholeNumber } from "./common";

const playerFields = {
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  role: z.enum(PLAYER_ROLES, { error: "Choose a valid role" }),
  basePrice: wholeNumber("Base Price", 1_000_000_000),
  matchesPlayed: wholeNumber("Matches Played", 10_000),
  totalRuns: wholeNumber("Total Runs", 1_000_000),
  totalWickets: wholeNumber("Total Wickets", 100_000),
};

type PlayerStats = {
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
};

/** A player who has never played cannot have scored runs or taken wickets. */
export function checkStatsConsistency(player: PlayerStats, ctx: z.RefinementCtx) {
  if (player.matchesPlayed === 0 && (player.totalRuns > 0 || player.totalWickets > 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["matchesPlayed"],
      message: "A player with 0 matches cannot have runs or wickets",
    });
  }
}

export const playerSchema = z.object(playerFields).superRefine(checkStatsConsistency);

/**
 * PUT /api/players/[id] accepts any subset of fields; at least one is
 * required. The merged result is re-validated with `playerSchema`.
 */
export const playerUpdateSchema = z
  .object(playerFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

export type PlayerInput = z.infer<typeof playerSchema>;
export type PlayerUpdateInput = z.infer<typeof playerUpdateSchema>;
