export const PLAYER_ROLES = [
  "BATSMAN",
  "BOWLER",
  "ALL_ROUNDER",
  "WICKETKEEPER",
] as const;

export type PlayerRole = (typeof PLAYER_ROLES)[number];

export const PLAYER_ROLE_LABELS: Record<PlayerRole, string> = {
  BATSMAN: "Batsman",
  BOWLER: "Bowler",
  ALL_ROUNDER: "All-rounder",
  WICKETKEEPER: "Wicketkeeper",
};

export function isPlayerRole(value: unknown): value is PlayerRole {
  return (
    typeof value === "string" &&
    (PLAYER_ROLES as readonly string[]).includes(value)
  );
}
