import { handleApiError, ok, readJson } from "@/lib/api/http";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/jwt";
import { startSession } from "@/lib/auth/session";
import { authenticateUser } from "@/lib/services/auth";

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * On success the signed JWT is returned in a `Set-Cookie: criico_session=...;
 * HttpOnly` header rather than in the JSON body, so client-side JavaScript
 * (and therefore any XSS payload) never sees the token.
 */
export async function POST(request: Request) {
  try {
    const user = await authenticateUser(await readJson(request));
    await startSession(user);
    return ok({
      user: { id: user.sub, name: user.name, email: user.email, role: user.role },
      expiresIn: SESSION_MAX_AGE_SECONDS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
