import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { applyCollectionValidators } from "@/lib/db/collection-validators";
import { connectDB } from "@/lib/db/connect";
import { Match } from "@/lib/db/models/match";
import { Player } from "@/lib/db/models/player";
import { User } from "@/lib/db/models/user";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { authenticateUser, registerUser } from "./auth";
import { getLeaderboard } from "./leaderboard";
import { listMatches, recordMatch } from "./matches";
import { createPlayer, getPlayer, updatePlayer } from "./players";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("criico-test");
  const { connection } = await connectDB();
  await applyCollectionValidators(connection);
  await Promise.all([User.syncIndexes(), Player.syncIndexes(), Match.syncIndexes()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Player.deleteMany({}), Match.deleteMany({})]);
});

const newPlayer = (overrides: Record<string, unknown> = {}) =>
  createPlayer({
    name: "Test Player",
    role: "BATSMAN",
    basePrice: 100000,
    matchesPlayed: 10,
    totalRuns: 300,
    totalWickets: 2,
    ...overrides,
  });

describe("player service", () => {
  it("creates, reads and partially updates a player", async () => {
    const created = await newPlayer();
    const updated = await updatePlayer(created.id, { totalRuns: 450 });

    expect(updated).toMatchObject({ name: "Test Player", totalRuns: 450, totalWickets: 2 });
    expect((await getPlayer(created.id)).totalRuns).toBe(450);
  });

  it("refuses a negative Total Runs update and leaves the player unchanged", async () => {
    const created = await newPlayer();
    await expect(updatePlayer(created.id, { totalRuns: -10 })).rejects.toBeInstanceOf(ZodError);
    expect((await getPlayer(created.id)).totalRuns).toBe(300);
  });

  it("answers 404 for unknown or malformed ids", async () => {
    await expect(getPlayer("64b7f0c2a1b2c3d4e5f60009")).rejects.toBeInstanceOf(NotFoundError);
    await expect(getPlayer("not-an-id")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("is backed by a database validator that rejects negative stats outside Mongoose", async () => {
    await expect(
      Player.collection.insertOne({
        name: "Raw Insert",
        role: "BOWLER",
        basePrice: 0,
        matchesPlayed: 1,
        totalRuns: -5,
        totalWickets: 0,
      }),
    ).rejects.toThrow(/Document failed validation/);
  });
});

describe("match service", () => {
  it("records a match and adds each performance to career totals", async () => {
    const batter = await newPlayer({ name: "Batter", totalRuns: 100, matchesPlayed: 5 });
    const bowler = await newPlayer({ name: "Bowler", role: "BOWLER", totalRuns: 10, totalWickets: 8, matchesPlayed: 5 });

    const match = await recordMatch(
      {
        teamA: "Strikers",
        teamB: "Titans",
        result: "TEAM_A",
        playedOn: "2026-10-20",
        performances: [
          { playerId: batter.id, team: "A", runs: 72, wickets: 0 },
          { playerId: bowler.id, team: "B", runs: 4, wickets: 3 },
        ],
      },
      null,
    );

    expect(match.performances.map((p) => p.playerName)).toEqual(["Batter", "Bowler"]);
    expect(await getPlayer(batter.id)).toMatchObject({ matchesPlayed: 6, totalRuns: 172, totalWickets: 2 });
    expect(await getPlayer(bowler.id)).toMatchObject({ matchesPlayed: 6, totalRuns: 14, totalWickets: 11 });
    expect(await listMatches()).toHaveLength(1);
  });

  it("rejects a match that references a player who does not exist", async () => {
    const real = await newPlayer();
    await expect(
      recordMatch(
        {
          teamA: "Strikers",
          teamB: "Titans",
          result: "TIE",
          performances: [
            { playerId: real.id, team: "A", runs: 10, wickets: 0 },
            { playerId: "64b7f0c2a1b2c3d4e5f60009", team: "B", runs: 10, wickets: 0 },
          ],
        },
        null,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(await Match.countDocuments()).toBe(0);
    expect((await getPlayer(real.id)).matchesPlayed).toBe(10);
  });

  it("rolls back the match and every stat change if any player update fails", async () => {
    const healthy = await newPlayer({ name: "Healthy" });
    // A legacy document that breaks the collection validator: any update to it fails.
    const { insertedId } = await Player.collection.insertOne(
      { name: "X", role: "BOWLER", basePrice: 0, matchesPlayed: 1, totalRuns: 0, totalWickets: 0 },
      { bypassDocumentValidation: true },
    );

    await expect(
      recordMatch(
        {
          teamA: "Strikers",
          teamB: "Titans",
          result: "TEAM_B",
          performances: [
            { playerId: healthy.id, team: "A", runs: 50, wickets: 0 },
            { playerId: insertedId.toString(), team: "B", runs: 5, wickets: 1 },
          ],
        },
        null,
      ),
    ).rejects.toThrow();

    expect(await Match.countDocuments()).toBe(0);
    expect(await getPlayer(healthy.id)).toMatchObject({ matchesPlayed: 10, totalRuns: 300 });
  });
});

describe("leaderboard service", () => {
  it("ranks stored players by Impact Score", async () => {
    await newPlayer({ name: "Keeper", role: "WICKETKEEPER", matchesPlayed: 30, totalRuns: 1500, totalWickets: 0 });
    await newPlayer({ name: "Rookie Bowler", role: "BOWLER", matchesPlayed: 0, totalRuns: 0, totalWickets: 0 });

    const board = await getLeaderboard();
    expect(board.map((p) => [p.rank, p.name, p.impactScore])).toEqual([
      [1, "Keeper", 1930],
      [2, "Rookie Bowler", -50],
    ]);
  });
});

describe("auth service", () => {
  const account = { name: "Club Admin", email: "Admin@Criico.dev", password: "secret123", confirmPassword: "secret123" };

  it("registers with a lower-cased email and authenticates", async () => {
    const registered = await registerUser(account);
    expect(registered.email).toBe("admin@criico.dev");

    const session = await authenticateUser({ email: "ADMIN@criico.dev", password: "secret123" });
    expect(session.sub).toBe(registered.sub);
  });

  it("stores a bcrypt hash, never the password", async () => {
    await registerUser(account);
    const stored = await User.findOne({ email: "admin@criico.dev" }).select("+passwordHash").lean();
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(stored?.passwordHash).not.toContain("secret123");
  });

  it("refuses duplicate emails and wrong passwords", async () => {
    await registerUser(account);
    await expect(registerUser(account)).rejects.toBeInstanceOf(ConflictError);
    await expect(authenticateUser({ email: account.email, password: "wrong-pass1" })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(authenticateUser({ email: "nobody@criico.dev", password: "secret123" })).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
