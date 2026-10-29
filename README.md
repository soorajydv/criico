# Criico: Cricket Club Manager

A full-stack Next.js app for managing local cricket players, recording match results and ranking players by a custom **Cricket Impact Score**.

- **Live URL:** _add after deploying (see [Deployment](#deployment))_

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Database | MongoDB (Atlas in production) via Mongoose 9 |
| Auth | JWT (HS256, `jose`) stored in an **HTTP-only cookie**, `bcryptjs` password hashes |
| Route protection | `src/middleware.ts` |
| Validation | Zod 4, one schema shared by the browser, Server Actions and API routes |
| Styling | Tailwind CSS 4 |
| Toasts | `sonner` |
| Tests | Vitest (unit tests + integration tests against an in-memory MongoDB replica set) |

## Requirements checklist

| Requirement | Where |
| --- | --- |
| Login / Register | `src/app/(auth)/*`, `src/app/api/auth/*` |
| JWT session in HTTP-only cookie | `src/lib/auth/jwt.ts`, `src/lib/auth/session.ts` |
| `/dashboard` protected by `middleware.ts`, redirects to `/login` | `src/middleware.ts` |
| Player CRUD (add, edit, view) | `src/app/dashboard/players/*`, `src/lib/services/players.ts` |
| `POST /api/auth/login` | `src/app/api/auth/login/route.ts` |
| `GET` + `POST /api/players` | `src/app/api/players/route.ts` |
| `PUT /api/players/[id]` | `src/app/api/players/[id]/route.ts` |
| `POST /api/matches` | `src/app/api/matches/route.ts` |
| `GET /api/leaderboard` | `src/app/api/leaderboard/route.ts` |
| Impact Score in TypeScript + unit tests | `src/lib/scoring/impact-score.ts`, `impact-score.test.ts` |
| Wicketkeeper can't get the Bowler multiplier (types) | `WicketkeeperModifier` in `impact-score.ts` |
| Server Action form submission | `src/app/dashboard/players/actions.ts` (Add/Edit player), `src/app/(auth)/actions.ts` (Register, Sign out) |
| RSC fetching the leaderboard | `src/app/dashboard/leaderboard/page.tsx` |
| Negative Total Runs shows a toast | `src/app/dashboard/players/player-form.tsx` |

## Why MongoDB

The data has one natural aggregate, **a match and its scorecard**, plus a small set of players whose career totals are read far more often than they are written.

1. **A match is one document.** Team names, the result and every player performance are embedded in a single `matches` document. A scorecard is always read and written as a whole, so it is one read with no joins, and the write is atomic on its own. A match has at most 22 performances, so the embedded array stays small.
2. **Fast leaderboard reads.** Career totals (`matchesPlayed`, `totalRuns`, `totalWickets`) are denormalised onto each player, so ranking is a single collection scan. They stay consistent because `recordMatch()` inserts the match and `$inc`s every player's totals inside a **multi-document transaction**. Either everything is saved or nothing is.
3. **Room to grow.** Per-match stats such as balls faced, overs, economy or catches can be added to the performance sub-document without a migration.
4. **Operationally simple on Vercel.** MongoDB Atlas has a free tier, connection pooling works well from serverless functions, and transactions work out of the box because Atlas is always a replica set.

**What a relational database would have given for free, and how it is covered here:**

| Concern | How it is handled |
| --- | --- |
| Foreign keys | `recordMatch()` checks that every `playerId` exists *inside* the transaction before writing |
| CHECK constraints (e.g. runs ≥ 0) | MongoDB `$jsonSchema` collection validators (`src/lib/db/collection-validators.ts`) reject negative stats even for writes that bypass Mongoose. An integration test proves it. |
| Unique email | Unique index on `users.email` (stored lower-cased) |

## Database schema

```text
users
  _id           ObjectId
  name          string
  email         string   unique, lower-cased
  passwordHash  string   bcrypt (select: false, never returned)
  role          "ADMIN" | "VIEWER"   (default ADMIN)
  createdAt, updatedAt

players
  _id           ObjectId
  name          string   2-80 chars, indexed
  role          "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKETKEEPER"
  basePrice     int >= 0 (whole Nepalese rupees; integers avoid float money bugs)
  matchesPlayed int >= 0
  totalRuns     int >= 0
  totalWickets  int >= 0
  createdAt, updatedAt

matches
  _id           ObjectId
  teamA, teamB  string (must differ, case-insensitive)
  result        "TEAM_A" | "TEAM_B" | "TIE" | "NO_RESULT"
  playedOn      Date
  recordedBy    ObjectId -> users
  performances: [                      embedded, 2-22 entries
    { player: ObjectId -> players,
      playerName: string,              snapshot so old scorecards survive renames
      team: "A" | "B",
      runs: int >= 0,
      wickets: int 0-10 }
  ]
  indexes: { playedOn: -1, createdAt: -1 }, { "performances.player": 1 }
```

The Impact Score is **not stored**. It is computed in TypeScript whenever it is read, so it can never drift from the formula or from the underlying stats.

## Authentication: why JWT in an HTTP-only cookie

- **Stateless verification on the Edge.** `middleware.ts` runs before every `/dashboard` request. Verifying a signed JWT with `jose` (Web Crypto) needs no database call, so protection is fast and works on the Edge runtime. This is also why `jose` is used instead of `jsonwebtoken`, which depends on Node's `crypto`.
- **The token never touches JavaScript.** The cookie is `HttpOnly` (unreadable by XSS), `Secure` in production, and `SameSite=Lax` (not sent on cross-site POSTs). The login endpoint returns the JWT in the `Set-Cookie` header, not in the response body.
- **Hardening:**
  - The algorithm is pinned to HS256, and issuer and audience are checked.
  - The token's claims are shape-checked after verification.
  - Invalid or expired cookies are deleted by middleware.
  - Mutating API routes only accept `application/json`, which blocks cross-site HTML form posts.
  - Login compares against a dummy bcrypt hash when the email doesn't exist, so response timing doesn't reveal which emails are registered.
  - The `?from=` redirect only allows same-site paths, so it can't be used as an open redirect.
- **Defence in depth.** Middleware is the gate, but the dashboard layout, every Server Action and every API route verify the session again. Mutations also require `role === "ADMIN"`. New sign-ups are admins (single-club tool), and a `VIEWER` role is supported for read-only users.

NextAuth was not used because the requirement is a simple email/password flow with explicit control over the token and cookie. A ~60-line `jwt.ts` is easier to audit than a framework adapter.

## The Cricket Impact Score

Source: [`src/lib/scoring/impact-score.ts`](src/lib/scoring/impact-score.ts)

```text
runPoints    = totalRuns    × runMultiplier    × 1.2
wicketPoints = totalWickets × wicketMultiplier × 20
score        = runPoints + wicketPoints + roleFlatBonus + experienceAdjustment
```

| Role | runMultiplier | wicketMultiplier | flat bonus |
| --- | --- | --- | --- |
| Batsman | **1.3** | 1 | 0 |
| Bowler | 1 | **1.5** | 0 |
| All-rounder | 1 | 1 | 0 |
| Wicketkeeper | 1 | **1 (locked)** | **+30** |

Experience: fewer than 5 matches gives **−50**, more than 20 matches gives **+100**, and exactly 5 or exactly 20 gives no adjustment.

**Wicketkeeper rule, enforced by types.** `ROLE_MODIFIERS` is declared `as const satisfies RoleModifierTable`. That table maps `WICKETKEEPER` to `WicketkeeperModifier`, whose `wicketMultiplier` is the literal type `1`. Writing `1.5` there fails to compile (`Type '1.5' is not assignable to type '1'`), and the test file has an `@ts-expect-error` assertion that `npm run typecheck` verifies. Because a player has exactly one `role`, a keeper can never also be treated as a bowler at runtime.

**Runtime guards.** Unknown roles throw a `TypeError`. Negative or fractional stats throw a `RangeError`. Scores are rounded to 2 decimals because `1.3 × 1.2 === 1.5599999999999998` in IEEE-754 arithmetic.

**Tests** ([`impact-score.test.ts`](src/lib/scoring/impact-score.test.ts)) cover:

- a Bowler with 0 matches (−50)
- a high-run veteran Wicketkeeper (1500 runs, 30 matches gives 1930)
- a Wicketkeeper with wickets not getting the ×1.5
- Batsman and Bowler multipliers, and All-rounder with none
- the 4/5/20/21 match boundaries
- rookie penalty stacked with the keeper bonus
- floating-point rounding
- invalid input

## API

Every response is `{ "data": ... }` or `{ "error": { "message", "fieldErrors"? } }`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | none | `{ email, password }`. Sets the `criico_session` HTTP-only JWT cookie |
| POST | `/api/auth/register` | none | `{ name, email, password, confirmPassword }` |
| POST | `/api/auth/logout` | none | Clears the cookie |
| GET | `/api/auth/me` | signed in | Current user |
| GET | `/api/players` | signed in | All players |
| POST | `/api/players` | admin | `{ name, role, basePrice, matchesPlayed, totalRuns, totalWickets }` |
| GET | `/api/players/:id` | signed in | One player |
| PUT | `/api/players/:id` | admin | Any subset of player fields, e.g. `{ "totalRuns": 812 }` |
| GET | `/api/matches` | signed in | Recent matches with scorecards |
| POST | `/api/matches` | admin | `{ teamA, teamB, result, playedOn?, performances: [{ playerId, team: "A"\|"B", runs, wickets }] }` |
| GET | `/api/leaderboard` | public | Players sorted by Impact Score, with rank and breakdown |

Status codes:

- `400` validation error
- `401` not signed in
- `403` not an admin
- `404` unknown id (malformed ObjectIds also return 404, never a cast error)
- `409` email already registered
- `415` body is not JSON

```bash
# Sign in and keep the cookie
curl -c jar.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@criico.dev","password":"Criico@2026"}' http://localhost:3000/api/auth/login

# Negative runs are rejected
curl -b jar.txt -H "Content-Type: application/json" \
  -d '{"name":"Test","role":"BATSMAN","basePrice":0,"matchesPlayed":1,"totalRuns":-5,"totalWickets":0}' \
  http://localhost:3000/api/players
# -> 400 {"error":{"message":"Total Runs cannot be negative", ...}}
```

**Match rules** (validated in `src/lib/validation/match.ts`):

- Teams must be different.
- Each side needs 1-11 players.
- A player can appear only once.
- Runs and wickets must be non-negative whole numbers.
- A bowling side can take at most 10 wickets (one limited-overs innings).
- The date can't be in the future.

Recording a match adds 1 to each listed player's `matchesPlayed` and adds their runs and wickets to their totals, all in one transaction.

## Server Actions and Server Components

- **Server Actions.** The Add Player and Edit Player forms call `createPlayerAction` and `updatePlayerAction` (`src/app/dashboard/players/actions.ts`) via `useActionState`. Register and Sign out are Server Actions too.
- **React Server Components.** `src/app/dashboard/leaderboard/page.tsx` is an `async` Server Component. It calls `getLeaderboard()` directly on the server (no client fetch, no extra HTTP hop) and streams HTML, with `loading.tsx` as the Suspense fallback. Every other dashboard page is also an RSC, and only the forms and nav are client components.

## Error handling: negative Total Runs

On the Add/Edit player form, entering `-25` in **Total Runs** shows a toast ("Total Runs cannot be negative") and marks the field inline. Three layers stop the value:

1. **Browser.** `player-form.tsx` validates with the same Zod schema before dispatching the Server Action. The form uses `noValidate`, because otherwise the browser's native `min` check would block the submit with its own tooltip and the toast would never show.
2. **Server.** The Server Action and `PUT/POST /api/players` re-validate. A server-side error comes back as action state and is also shown as a toast.
3. **Database.** The `$jsonSchema` validator rejects `totalRuns < 0`.

Every other form (login, register, record match) toasts its errors too, including network failures.

## Getting started

Requires Node 20+.

```bash
npm install
cp .env.example .env.local        # then set JWT_SECRET (command in the file)

# Set MONGODB_URI to your existing MongoDB replica-set deployment.

npm run dev                       # http://localhost:3000
```

To create the requested admin and current Nepal squad roster in the configured database:

```bash
npm run db:seed
```

The seed is safe to re-run. It creates or updates `soorajydv9@gmail.com` as an admin and inserts the current Nepal roster without duplicating existing players. The default password is `Password@123`; change it in `scripts/seed.ts` before sharing or deploying the repository.

| Script | Purpose |
| --- | --- |
| `npm test` | All Vitest suites (unit + integration; integration starts its own in-memory replica set) |
| `npm run typecheck` | `tsc --noEmit`, including the `@ts-expect-error` Wicketkeeper type check |
| `npm run lint` | ESLint |
| `npm run db:seed` | Create/update the admin and seed the Nepal roster |
Recording a match uses a transaction, so the configured MongoDB deployment must support transactions (for example, a replica set or MongoDB Atlas).

## Deployment

1. **MongoDB Atlas.** Create a free M0 cluster and a database user. Under *Network Access*, allow `0.0.0.0/0`, because Vercel functions use dynamic IPs. Copy the connection string and add a database name, e.g. `.../criico?retryWrites=true&w=majority`.
2. **Vercel.** Import the GitHub repo and set the environment variables `MONGODB_URI` and `JWT_SECRET` (48+ random characters). Deploy.

## Testing

```text
src/lib/scoring/impact-score.test.ts         formula, role multipliers, boundaries, type constraint
src/lib/scoring/leaderboard.test.ts          ordering, shared ranks on ties, no input mutation
src/lib/validation/validation.test.ts        negative runs, null/""/fraction rejection, match rules
src/lib/auth/auth.test.ts                    JWT round-trip, tampering, wrong secret, expiry, open redirect
src/lib/services/services.integration.test.ts
    real MongoDB replica set: CRUD, DB validator, match transaction + rollback, auth
```

## Bugs fixed during development

1. **Collection validator setup raced Mongoose `autoCreate`.**
   - *Symptom:* the first integration test run failed with `MongoServerError: namespace criico-test.players already exists, but with different options`.
   - *Cause:* `applyCollectionValidators()` called `listCollections()` and then `createCollection()`. In between, Mongoose's `autoCreate` created the `players` collection as soon as the model connected, so the "doesn't exist yet" branch was stale. It was a classic check-then-act race.
   - *Fix:* always try `createCollection()` first and fall back to `collMod` on error code 48 (`NamespaceExists`). See `src/lib/db/collection-validators.ts`.
2. **Edge build warning from `jose`.**
   - *Symptom:* `next build` warned that `CompressionStream` / `DecompressionStream` are "not supported in the Edge Runtime", with an import trace to `src/lib/auth/jwt.ts`.
   - *Cause:* `import { jwtVerify, SignJWT } from "jose"` loads the package's barrel file, which pulls JWE decryption and deflate code into the middleware bundle even though only JWS is used.
   - *Fix:* import the exact subpaths (`jose/jwt/sign`, `jose/jwt/verify`). The warning is gone and the Edge bundle is smaller.

## Project structure

```text
src/
  middleware.ts                 /dashboard guard (Edge)
  app/
    (auth)/                     login, register, auth Server Actions
    api/                        REST route handlers
    dashboard/                  overview, players, matches, leaderboard (RSC)
  components/ui.tsx             Tailwind UI primitives
  lib/
    auth/                       jwt (Edge-safe), session (server-only), redirect guard
    db/                         Mongo connection cache, models, $jsonSchema validators
    scoring/                    Impact Score + ranking (pure, framework-free)
    services/                   business logic shared by API routes, Server Actions and RSCs
    validation/                 Zod schemas shared by client and server
```
