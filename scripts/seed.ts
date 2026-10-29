import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { Player } from "@/lib/db/models/player";
import { Match } from "@/lib/db/models/match";
import { recordMatch } from "@/lib/services/matches";
import type { PlayerRole } from "@/lib/players/roles";

/**
 * Current Nepal men's senior roster from the Cricket Association of Nepal.
 * The 15-player tournament group is included in this larger roster.
 *
 * The app stores local club totals, so those values intentionally start at 0
 * and can be updated as matches are recorded in Criico.
 */
const NEPAL_SQUAD: Array<{ name: string; role: PlayerRole }> = [
  { name: "Rohit Paudel", role: "ALL_ROUNDER" },
  { name: "Dipendra Singh Airee", role: "ALL_ROUNDER" },
  { name: "Sandeep Lamichhane", role: "BOWLER" },
  { name: "Sompal Kami", role: "BOWLER" },
  { name: "Aasif Sheikh", role: "WICKETKEEPER" },
  { name: "Karan KC", role: "BOWLER" },
  { name: "Kushal Bhurtel", role: "BATSMAN" },
  { name: "Gulshan Jha", role: "ALL_ROUNDER" },
  { name: "Lalit Rajbanshi", role: "BOWLER" },
  { name: "Anil Kumar Sah", role: "WICKETKEEPER" },
  { name: "Sundeep Jora", role: "BATSMAN" },
  { name: "Aarif Sheikh", role: "ALL_ROUNDER" },
  { name: "Bhim Sharki", role: "BATSMAN" },
  { name: "Kushal Malla", role: "ALL_ROUNDER" },
  { name: "Sagar Dhakal", role: "BOWLER" },
  { name: "Sher Malla", role: "BOWLER" },
  { name: "Lokesh Bam", role: "WICKETKEEPER" },
  { name: "Shahab Alam", role: "BOWLER" },
  { name: "Akash Chand", role: "BOWLER" },
  { name: "Bibek Yadav", role: "ALL_ROUNDER" },
  { name: "Surya Tamang", role: "BOWLER" },
  { name: "Rijan Dhakal", role: "BOWLER" },
  { name: "Dev Khanal", role: "BATSMAN" },
  { name: "Bashir Ahmad", role: "ALL_ROUNDER" },
  { name: "Pratis GC", role: "BOWLER" },
  { name: "Abinash Bohara", role: "BOWLER" },
  { name: "Mayan Yadav", role: "ALL_ROUNDER" },
  { name: "Arjun Gharti", role: "WICKETKEEPER" },
  { name: "Hemant Dhami", role: "BOWLER" },
  { name: "Dipesh Prasad Kandel", role: "ALL_ROUNDER" },
  { name: "Rupesh Singh", role: "BOWLER" },
  { name: "Arjun Kumal", role: "BATSMAN" },
  { name: "Subh Kansakar", role: "BATSMAN" },
  { name: "Santosh Yadav", role: "BOWLER" },
];

type SeedPerformance = readonly [name: string, team: "A" | "B", runs: number, wickets: number];

const SEED_MATCHES: Array<{
  teamA: string;
  teamB: string;
  result: "TEAM_A" | "TEAM_B";
  playedOn: string;
  performances: SeedPerformance[];
}> = [
  {
    teamA: "Nepal XI",
    teamB: "Kathmandu Kings",
    result: "TEAM_A" as const,
    playedOn: "2026-10-25",
    performances: [
      ["Rohit Paudel", "A", 78, 0],
      ["Aasif Sheikh", "A", 54, 0],
      ["Dipendra Singh Airee", "A", 31, 2],
      ["Sandeep Lamichhane", "A", 8, 3],
      ["Kushal Bhurtel", "B", 66, 0],
      ["Gulshan Jha", "B", 42, 1],
      ["Sompal Kami", "B", 18, 2],
      ["Karan KC", "B", 11, 2],
    ],
  },
  {
    teamA: "Nepal XI",
    teamB: "Pokhara Rhinos",
    result: "TEAM_B" as const,
    playedOn: "2026-10-18",
    performances: [
      ["Kushal Malla", "A", 47, 1],
      ["Aarif Sheikh", "A", 39, 0],
      ["Lalit Rajbanshi", "A", 5, 2],
      ["Sundeep Jora", "A", 28, 0],
      ["Bhim Sharki", "B", 83, 0],
      ["Lokesh Bam", "B", 46, 0],
      ["Sagar Dhakal", "B", 14, 3],
      ["Sher Malla", "B", 9, 1],
    ],
  },
];

const ADMIN = {
  name: "Sooraj Ydv",
  email: "soorajydv9@gmail.com",
  password: "Password@123",
};

async function seed() {
  await connectDB();

  await User.updateOne(
    { email: ADMIN.email },
    {
      $set: {
        name: ADMIN.name,
        email: ADMIN.email,
        passwordHash: await bcrypt.hash(ADMIN.password, 10),
        role: "ADMIN",
      },
    },
    { upsert: true },
  );

  const operations = NEPAL_SQUAD.map((player, index) => ({
    updateOne: {
      filter: { name: player.name },
      update: {
        $set: {
          name: player.name,
          role: player.role,
          basePrice: (NEPAL_SQUAD.length - index) * 100_000,
        },
        $setOnInsert: {
          matchesPlayed: 0,
          totalRuns: 0,
          totalWickets: 0,
        },
      },
      upsert: true,
    },
  }));

  await Player.bulkWrite(operations);

  const players = await Player.find({ name: { $in: NEPAL_SQUAD.map((player) => player.name) } }).lean();
  const playerIds = new Map(players.map((player) => [player.name, player._id.toString()]));
  const admin = await User.findOne({ email: ADMIN.email }).select("_id").lean();

  for (const match of SEED_MATCHES) {
    const exists = await Match.exists({ teamA: match.teamA, teamB: match.teamB, playedOn: new Date(`${match.playedOn}T00:00:00.000Z`) });
    if (exists) continue;

    await recordMatch(
      {
        ...match,
        performances: match.performances.map(([name, team, runs, wickets]) => ({
          playerId: playerIds.get(name)!,
          team,
          runs,
          wickets,
        })),
      },
      admin?._id.toString() ?? null,
    );
  }

  console.log(`Admin ready: ${ADMIN.email}`);
  console.log(`Nepal roster ready: ${NEPAL_SQUAD.length} players`);
  console.log(`Seed matches ready: ${SEED_MATCHES.length}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
