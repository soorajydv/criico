import {
  getImpactScoreBreakdown,
  type ImpactScoreBreakdown,
  type ImpactScoreInput,
} from "./impact-score";

export type RankedPlayer<T extends ImpactScoreInput & { name: string }> = T & {
  rank: number;
  impactScore: number;
  breakdown: ImpactScoreBreakdown;
};

/**
 * Sorts players by Impact Score (highest first). Ties share a rank
 * (standard competition ranking: 1, 2, 2, 4) and are listed alphabetically.
 */
export function rankPlayers<T extends ImpactScoreInput & { name: string }>(
  players: readonly T[],
): RankedPlayer<T>[] {
  const scored = players.map((player) => {
    const breakdown = getImpactScoreBreakdown(player);
    return { ...player, impactScore: breakdown.total, breakdown };
  });

  scored.sort(
    (a, b) => b.impactScore - a.impactScore || a.name.localeCompare(b.name),
  );

  let previousScore: number | undefined;
  let previousRank = 0;
  return scored.map((player, index) => {
    const rank = player.impactScore === previousScore ? previousRank : index + 1;
    previousScore = player.impactScore;
    previousRank = rank;
    return { ...player, rank };
  });
}
