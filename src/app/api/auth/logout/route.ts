import { ok } from "@/lib/api/http";
import { endSession } from "@/lib/auth/session";

/** POST /api/auth/logout: clears the session cookie. */
export async function POST() {
  await endSession();
  return ok({ loggedOut: true });
}
