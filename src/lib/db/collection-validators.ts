import type { Connection } from "mongoose";
import { PLAYER_ROLES } from "@/lib/players/roles";

const nonNegativeInt = { bsonType: ["int", "long", "double"], minimum: 0, multipleOf: 1 };

/**
 * MongoDB-side $jsonSchema validators. Mongoose validates on save, but raw
 * `$inc` updates and anything that bypasses Mongoose are only caught here,
 * so a negative run total can never be persisted, whatever the code path.
 */
const validators: Record<string, object> = {
  players: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role", "basePrice", "matchesPlayed", "totalRuns", "totalWickets"],
      properties: {
        name: { bsonType: "string", minLength: 2, maxLength: 80 },
        role: { enum: [...PLAYER_ROLES] },
        basePrice: nonNegativeInt,
        matchesPlayed: nonNegativeInt,
        totalRuns: nonNegativeInt,
        totalWickets: nonNegativeInt,
      },
    },
  },
  matches: {
    $jsonSchema: {
      bsonType: "object",
      required: ["teamA", "teamB", "result", "playedOn", "performances"],
      properties: {
        result: { enum: ["TEAM_A", "TEAM_B", "TIE", "NO_RESULT"] },
        performances: {
          bsonType: "array",
          minItems: 2,
          items: {
            bsonType: "object",
            required: ["player", "team", "runs", "wickets"],
            properties: {
              player: { bsonType: "objectId" },
              team: { enum: ["A", "B"] },
              runs: nonNegativeInt,
              wickets: { ...nonNegativeInt, maximum: 10 },
            },
          },
        },
      },
    },
  },
};

const NAMESPACE_EXISTS = 48;

export async function applyCollectionValidators(connection: Connection): Promise<void> {
  const db = connection.db;
  if (!db) throw new Error("Database connection is not open");

  for (const [name, validator] of Object.entries(validators)) {
    const options = { validator, validationLevel: "strict", validationAction: "error" } as const;
    // Try to create first and fall back to collMod. Checking listCollections()
    // first is racy: Mongoose's autoCreate can create the collection between
    // the check and createCollection(), which then fails with NamespaceExists.
    try {
      await db.createCollection(name, options);
    } catch (error) {
      if ((error as { code?: number }).code !== NAMESPACE_EXISTS) throw error;
      await db.command({ collMod: name, ...options });
    }
  }
}
