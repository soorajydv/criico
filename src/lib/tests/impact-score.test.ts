import { describe, expect, it } from "vitest";
import {
  calculateImpactScore,
  getImpactScoreBreakdown,
  ROLE_MODIFIERS,
  type ImpactScoreInput,
  type WicketkeeperModifier,
} from "@/lib/scoring/impact-score";

const player = (overrides: Partial<ImpactScoreInput>): ImpactScoreInput => ({
  role: "ALL_ROUNDER",
  matchesPlayed: 10,
  totalRuns: 0,
  totalWickets: 0,
  ...overrides,
});

describe("calculateImpactScore", () => {
  it("gives a Bowler with 0 matches only the rookie penalty", () => {
    expect(
      calculateImpactScore(player({ role: "BOWLER", matchesPlayed: 0 })),
    ).toBe(-50);
  });

  it("gives a high-scoring veteran Wicketkeeper the flat +30 and veteran +100", () => {
    // 1500 * 1.2 = 1800, + 30 keeper bonus, + 100 veteran bonus
    expect(
      calculateImpactScore(
        player({ role: "WICKETKEEPER", matchesPlayed: 30, totalRuns: 1500 }),
      ),
    ).toBe(1930);
  });

  it("never applies the Bowler wicket multiplier to a Wicketkeeper", () => {
    const stats = { matchesPlayed: 10, totalWickets: 10 };
    // Keeper: 10 * 20 + 30 = 230. Bowler with identical stats: 10 * 1.5 * 20 = 300.
    expect(calculateImpactScore(player({ role: "WICKETKEEPER", ...stats }))).toBe(230);
    expect(calculateImpactScore(player({ role: "BOWLER", ...stats }))).toBe(300);
  });

  it("multiplies a Batsman's runs by 1.3 before the base score", () => {
    // (500 * 1.3) * 1.2 = 780, + 2 * 20 = 40
    expect(
      calculateImpactScore(
        player({ role: "BATSMAN", totalRuns: 500, totalWickets: 2 }),
      ),
    ).toBe(820);
  });

  it("multiplies a Bowler's wickets by 1.5 before the base score", () => {
    // 100 * 1.2 = 120, + (40 * 1.5) * 20 = 1200, + 100 veteran
    expect(
      calculateImpactScore(
        player({ role: "BOWLER", matchesPlayed: 25, totalRuns: 100, totalWickets: 40 }),
      ),
    ).toBe(1420);
  });

  it("applies no role multiplier to an All-rounder", () => {
    // 300 * 1.2 = 360, + 15 * 20 = 300
    expect(
      calculateImpactScore(player({ totalRuns: 300, totalWickets: 15 })),
    ).toBe(660);
  });

  it.each([
    [0, -50],
    [4, -50],
    [5, 0],
    [20, 0],
    [21, 100],
  ])("treats %i matches as an experience adjustment of %i", (matchesPlayed, expected) => {
    expect(calculateImpactScore(player({ matchesPlayed }))).toBe(expected);
  });

  it("stacks the rookie penalty with the Wicketkeeper bonus", () => {
    // 50 * 1.2 = 60, + 30 keeper, - 50 rookie
    expect(
      calculateImpactScore(
        player({ role: "WICKETKEEPER", matchesPlayed: 3, totalRuns: 50 }),
      ),
    ).toBe(40);
  });

  it("returns clean 2-decimal scores despite floating point multiplication", () => {
    // 1.3 * 1.2 is 1.5599999999999998 in IEEE-754
    expect(calculateImpactScore(player({ role: "BATSMAN", totalRuns: 1 }))).toBe(1.56);
  });

  it("rejects negative or fractional stats", () => {
    expect(() => calculateImpactScore(player({ totalRuns: -1 }))).toThrow(RangeError);
    expect(() => calculateImpactScore(player({ totalWickets: -3 }))).toThrow(RangeError);
    expect(() => calculateImpactScore(player({ matchesPlayed: 2.5 }))).toThrow(RangeError);
  });

  it("rejects a role outside the four known roles", () => {
    const bogus = player({ role: "CAPTAIN" as ImpactScoreInput["role"] });
    expect(() => calculateImpactScore(bogus)).toThrow(TypeError);
  });
});

describe("getImpactScoreBreakdown", () => {
  it("itemises each part of the score and sums to the total", () => {
    const breakdown = getImpactScoreBreakdown(
      player({ role: "WICKETKEEPER", matchesPlayed: 22, totalRuns: 400, totalWickets: 1 }),
    );
    expect(breakdown).toEqual({
      runPoints: 480,
      wicketPoints: 20,
      roleBonus: 30,
      experienceAdjustment: 100,
      total: 630,
    });
  });
});

describe("Wicketkeeper type constraint", () => {
  it("keeps the Wicketkeeper wicket multiplier locked to 1", () => {
    expect(ROLE_MODIFIERS.WICKETKEEPER.wicketMultiplier).toBe(1);

    // Compile-time check (run by `npm run typecheck`): handing a keeper the
    // Bowler multiplier must not type-check.
    const invalidKeeper: WicketkeeperModifier = {
      runMultiplier: 1,
      // @ts-expect-error - a Wicketkeeper cannot take the Bowler wicket multiplier
      wicketMultiplier: ROLE_MODIFIERS.BOWLER.wicketMultiplier,
      flatBonus: 30,
    };
    expect(invalidKeeper).toBeDefined();
  });
});
