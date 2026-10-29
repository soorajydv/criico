import { describe, expect, it } from "vitest";
import { firstErrorMessage, toFieldErrors } from "./common";
import { matchSchema } from "./match";
import { playerSchema, playerUpdateSchema } from "./player";
import { registerSchema } from "./auth";

const validPlayer = {
  name: "Rohit Sharma",
  role: "BATSMAN",
  basePrice: "20000000",
  matchesPlayed: "12",
  totalRuns: "640",
  totalWickets: "1",
};

describe("playerSchema", () => {
  it("accepts FormData-style strings and converts them to numbers", () => {
    const result = playerSchema.parse(validPlayer);
    expect(result).toMatchObject({ totalRuns: 640, matchesPlayed: 12, basePrice: 20_000_000 });
  });

  it("rejects negative Total Runs with a message the UI can toast", () => {
    const result = playerSchema.safeParse({ ...validPlayer, totalRuns: "-25" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).totalRuns).toBe("Total Runs cannot be negative");
      expect(firstErrorMessage(result.error)).toBe("Total Runs cannot be negative");
    }
  });

  it("rejects a negative Base Price", () => {
    const result = playerSchema.safeParse({ ...validPlayer, basePrice: "-6" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).basePrice).toBe("Base Price cannot be negative");
    }
  });

  it("does not silently turn empty, null or boolean input into 0", () => {
    for (const totalRuns of ["", "   ", null, true]) {
      expect(playerSchema.safeParse({ ...validPlayer, totalRuns }).success).toBe(false);
    }
  });

  it("rejects fractional and non-numeric stats", () => {
    expect(playerSchema.safeParse({ ...validPlayer, totalWickets: "2.5" }).success).toBe(false);
    expect(playerSchema.safeParse({ ...validPlayer, totalRuns: "abc" }).success).toBe(false);
    expect(playerSchema.safeParse({ ...validPlayer, totalRuns: "1e2" }).success).toBe(false);
  });

  it("rejects runs or wickets for a player with 0 matches", () => {
    const result = playerSchema.safeParse({ ...validPlayer, matchesPlayed: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown role", () => {
    expect(playerSchema.safeParse({ ...validPlayer, role: "CAPTAIN" }).success).toBe(false);
  });

  it("allows partial updates but still rejects negative values", () => {
    expect(playerUpdateSchema.parse({ totalRuns: 700 })).toEqual({ totalRuns: 700 });
    expect(playerUpdateSchema.safeParse({ totalRuns: -1 }).success).toBe(false);
    expect(playerUpdateSchema.safeParse({}).success).toBe(false);
  });
});

const playerA = "64b7f0c2a1b2c3d4e5f60001";
const playerB = "64b7f0c2a1b2c3d4e5f60002";

const validMatch = {
  teamA: "Royal Strikers",
  teamB: "Thunder XI",
  result: "TEAM_A",
  playedOn: "2026-10-20",
  performances: [
    { playerId: playerA, team: "A", runs: 54, wickets: 0 },
    { playerId: playerB, team: "B", runs: 12, wickets: 3 },
  ],
};

describe("matchSchema", () => {
  it("accepts a well-formed match", () => {
    expect(matchSchema.safeParse(validMatch).success).toBe(true);
  });

  it("rejects the same team on both sides (case-insensitive)", () => {
    const result = matchSchema.safeParse({ ...validMatch, teamB: "royal strikers" });
    expect(result.success).toBe(false);
  });

  it("rejects a player appearing twice", () => {
    const result = matchSchema.safeParse({
      ...validMatch,
      performances: [...validMatch.performances, { playerId: playerA, team: "B", runs: 1, wickets: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a side taking more than 10 wickets", () => {
    const result = matchSchema.safeParse({
      ...validMatch,
      performances: [
        { playerId: playerA, team: "A", runs: 0, wickets: 6 },
        { playerId: "64b7f0c2a1b2c3d4e5f60003", team: "A", runs: 0, wickets: 5 },
        { playerId: playerB, team: "B", runs: 10, wickets: 0 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstErrorMessage(result.error)).toMatch(/only take 10/);
    }
  });

  it("requires at least one performance per team", () => {
    const result = matchSchema.safeParse({ ...validMatch, performances: [validMatch.performances[0]] });
    expect(result.success).toBe(false);
  });

  it("rejects negative runs in a performance", () => {
    const result = matchSchema.safeParse({
      ...validMatch,
      performances: [{ ...validMatch.performances[0], runs: -4 }, validMatch.performances[1]],
    });
    expect(result.success).toBe(false);
  });

  it("rejects match dates in the future", () => {
    expect(matchSchema.safeParse({ ...validMatch, playedOn: "2999-01-01" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("normalises email and requires matching passwords", () => {
    const ok = registerSchema.parse({
      name: "Admin",
      email: "  Admin@Criico.DEV ",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(ok.email).toBe("admin@criico.dev");

    expect(
      registerSchema.safeParse({ name: "Admin", email: "a@b.co", password: "secret123", confirmPassword: "nope" }).success,
    ).toBe(false);
  });
});
