import { describe, expect, it } from "vitest";
import { rankPlayers } from "./leaderboard";
import type { PlayerRole } from "@/lib/players/roles";

const make = (
  name: string,
  role: PlayerRole,
  matchesPlayed: number,
  totalRuns: number,
  totalWickets: number,
) => ({ name, role, matchesPlayed, totalRuns, totalWickets });

describe("rankPlayers", () => {
  it("orders players by Impact Score, highest first", () => {
    const ranked = rankPlayers([
      make("Rookie", "BOWLER", 0, 0, 0), // -50
      make("Opener", "BATSMAN", 10, 500, 0), // 780
      make("Spinner", "BOWLER", 25, 100, 40), // 1420
    ]);

    expect(ranked.map((p) => [p.rank, p.name, p.impactScore])).toEqual([
      [1, "Spinner", 1420],
      [2, "Opener", 780],
      [3, "Rookie", -50],
    ]);
  });

  it("gives tied players the same rank and lists them alphabetically", () => {
    const ranked = rankPlayers([
      make("Zed", "ALL_ROUNDER", 10, 100, 0), // 120
      make("Amir", "ALL_ROUNDER", 10, 100, 0), // 120
      make("Top", "ALL_ROUNDER", 10, 1000, 0), // 1200
      make("Last", "ALL_ROUNDER", 10, 10, 0), // 12
    ]);

    expect(ranked.map((p) => [p.rank, p.name])).toEqual([
      [1, "Top"],
      [2, "Amir"],
      [2, "Zed"],
      [4, "Last"],
    ]);
  });

  it("does not mutate the input array", () => {
    const players = [make("B", "BATSMAN", 10, 1, 0), make("A", "BATSMAN", 10, 999, 0)];
    rankPlayers(players);
    expect(players.map((p) => p.name)).toEqual(["B", "A"]);
  });
});
