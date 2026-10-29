// Edge-safe: imported by middleware.ts, so only `jose` (Web Crypto) is allowed
// here, not `jsonwebtoken` (Node crypto) or anything that pulls in Mongoose.
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { USER_ROLES, type UserRole } from "./roles";

export const SESSION_COOKIE = "criico_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const ISSUER = "criico";
const AUDIENCE = "criico-dashboard";

export interface SessionPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns the session for a valid token, or null for a missing/expired/tampered one. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"], // pin the algorithm so "alg: none" tokens are refused
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const { sub, name, email, role } = payload;
    if (
      typeof sub !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      !(USER_ROLES as readonly unknown[]).includes(role)
    ) {
      return null;
    }
    return { sub, name, email, role: role as UserRole };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true, // not readable from JavaScript, so XSS cannot steal the token
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // not sent on cross-site POSTs (CSRF)
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
