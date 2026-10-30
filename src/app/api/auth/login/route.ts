import { loginController } from "@/lib/controllers/auth.controller";

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * On success the signed JWT is returned in a `Set-Cookie: criico_session=...;
 * HttpOnly` header rather than in the JSON body, so client-side JavaScript
 * (and therefore any XSS payload) never sees the token.
 */
export const POST = loginController;
