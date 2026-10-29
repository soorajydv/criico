import { isPlayerRole, type PlayerRole } from "@/lib/players/roles";

/**
 * Cricket Impact Score
 *
 *   Base score       = (Total Runs * 1.2) + (Total Wickets * 20)
 *   Role multiplier  = Batsman: runs   * 1.3 before they enter the base score
 *                      Bowler:  wickets * 1.5 before they enter the base score
 *   Experience       = < 5 matches  -> -50  (rookie penalty)
 *                      > 20 matches -> +100 (veteran bonus)
 *   Wicketkeeper     = flat +30, and never the Bowler wicket multiplier
 */

export const RUN_POINTS = 1.2;
export const WICKET_POINTS = 20;

export const ROOKIE_MATCH_THRESHOLD = 5;
export const ROOKIE_PENALTY = -50;
export const VETERAN_MATCH_THRESHOLD = 20;
export const VETERAN_BONUS = 100;

export interface RoleModifier {
  /** Applied to Total Runs before the run points are added to the base score. */
  readonly runMultiplier: number;
  /** Applied to Total Wickets before the wicket points are added to the base score. */
  readonly wicketMultiplier: number;
  /** Flat points added on top of the base score. */
  readonly flatBonus: number;
}

/**
 * A wicketkeeper's wicket multiplier is the literal type `1`, so giving a
 * wicketkeeper the Bowler multiplier (1.5) is a compile-time error rather
 * than something we hope a reviewer notices.
 */
export interface WicketkeeperModifier extends RoleModifier {
  readonly wicketMultiplier: 1;
  readonly flatBonus: 30;
}

type RoleModifierTable = {
  readonly [R in PlayerRole]: R extends "WICKETKEEPER"
    ? WicketkeeperModifier
    : RoleModifier;
};

export const ROLE_MODIFIERS = {
  BATSMAN: { runMultiplier: 1.3, wicketMultiplier: 1, flatBonus: 0 },
  BOWLER: { runMultiplier: 1, wicketMultiplier: 1.5, flatBonus: 0 },
  ALL_ROUNDER: { runMultiplier: 1, wicketMultiplier: 1, flatBonus: 0 },
  WICKETKEEPER: { runMultiplier: 1, wicketMultiplier: 1, flatBonus: 30 },
} as const satisfies RoleModifierTable;

export interface ImpactScoreInput {
  role: PlayerRole;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
}

export interface ImpactScoreBreakdown {
  runPoints: number;
  wicketPoints: number;
  roleBonus: number;
  experienceAdjustment: number;
  total: number;
}

/** Rounds to 2 decimals so 1.3 * 1.2 reads 1.56, not 1.5599999999999998. */
export function roundScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer (got ${value})`);
  }
}

export function getExperienceAdjustment(matchesPlayed: number): number {
  if (matchesPlayed < ROOKIE_MATCH_THRESHOLD) return ROOKIE_PENALTY;
  if (matchesPlayed > VETERAN_MATCH_THRESHOLD) return VETERAN_BONUS;
  return 0;
}

export function getImpactScoreBreakdown(
  player: ImpactScoreInput,
): ImpactScoreBreakdown {
  // Rows coming from the database or an API body are only typed, not trusted.
  if (!isPlayerRole(player.role)) {
    throw new TypeError(`Unknown player role: ${String(player.role)}`);
  }
  assertNonNegativeInteger(player.matchesPlayed, "matchesPlayed");
  assertNonNegativeInteger(player.totalRuns, "totalRuns");
  assertNonNegativeInteger(player.totalWickets, "totalWickets");

  const modifier: RoleModifier = ROLE_MODIFIERS[player.role];

  const runPoints = player.totalRuns * modifier.runMultiplier * RUN_POINTS;
  const wicketPoints =
    player.totalWickets * modifier.wicketMultiplier * WICKET_POINTS;
  const experienceAdjustment = getExperienceAdjustment(player.matchesPlayed);

  return {
    runPoints: roundScore(runPoints),
    wicketPoints: roundScore(wicketPoints),
    roleBonus: modifier.flatBonus,
    experienceAdjustment,
    total: roundScore(
      runPoints + wicketPoints + modifier.flatBonus + experienceAdjustment,
    ),
  };
}

export function calculateImpactScore(player: ImpactScoreInput): number {
  return getImpactScoreBreakdown(player).total;
}
