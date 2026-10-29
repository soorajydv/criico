import { z } from "zod";
import { objectIdSchema, wholeNumber } from "./common";

export const MATCH_RESULTS = ["TEAM_A", "TEAM_B", "TIE", "NO_RESULT"] as const;
export type MatchResult = (typeof MATCH_RESULTS)[number];

export const TEAM_SIDES = ["A", "B"] as const;
export type TeamSide = (typeof TEAM_SIDES)[number];

export const MAX_PLAYERS_PER_TEAM = 11;
/** One limited-overs innings: a bowling side can take at most 10 wickets. */
export const MAX_WICKETS_PER_SIDE = 10;
export const MAX_RUNS_PER_INNINGS = 1000;

const teamName = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(60, `${label} must be at most 60 characters`);

/** Latest calendar date anywhere in the world (UTC+14), so "today" is never rejected. */
function latestAllowedMatchDate(now = new Date()): string {
  return new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const performanceSchema = z.object({
  playerId: objectIdSchema("Each performance needs a valid player"),
  team: z.enum(TEAM_SIDES, { error: "Team must be A or B" }),
  runs: wholeNumber("Runs", MAX_RUNS_PER_INNINGS),
  wickets: wholeNumber("Wickets", MAX_WICKETS_PER_SIDE),
});

export const matchSchema = z
  .object({
    teamA: teamName("Team A"),
    teamB: teamName("Team B"),
    result: z.enum(MATCH_RESULTS, { error: "Choose a valid result" }),
    playedOn: z.iso.date("Match date must be a valid date (YYYY-MM-DD)").optional(),
    performances: z.array(performanceSchema, { error: "Player performances are required" }),
  })
  .superRefine((match, ctx) => {
    if (match.teamA.toLowerCase() === match.teamB.toLowerCase()) {
      ctx.addIssue({ code: "custom", path: ["teamB"], message: "Team A and Team B must be different" });
    }

    if (match.playedOn && match.playedOn > latestAllowedMatchDate()) {
      ctx.addIssue({ code: "custom", path: ["playedOn"], message: "Match date cannot be in the future" });
    }

    const seen = new Set<string>();
    match.performances.forEach((performance, index) => {
      const id = performance.playerId.toLowerCase();
      if (seen.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["performances", index, "playerId"],
          message: "A player can only appear once in a match",
        });
      }
      seen.add(id);
    });

    for (const side of TEAM_SIDES) {
      const label = side === "A" ? "Team A" : "Team B";
      const squad = match.performances.filter((p) => p.team === side);

      if (squad.length === 0) {
        ctx.addIssue({ code: "custom", path: ["performances"], message: `${label} needs at least one player performance` });
      }
      if (squad.length > MAX_PLAYERS_PER_TEAM) {
        ctx.addIssue({ code: "custom", path: ["performances"], message: `${label} cannot have more than ${MAX_PLAYERS_PER_TEAM} players` });
      }

      const wickets = squad.reduce((sum, p) => sum + p.wickets, 0);
      if (wickets > MAX_WICKETS_PER_SIDE) {
        ctx.addIssue({
          code: "custom",
          path: ["performances"],
          message: `${label} bowlers took ${wickets} wickets, but a side can only take ${MAX_WICKETS_PER_SIDE}`,
        });
      }
    }
  });

export type MatchInput = z.infer<typeof matchSchema>;
export type PerformanceInput = z.infer<typeof performanceSchema>;
