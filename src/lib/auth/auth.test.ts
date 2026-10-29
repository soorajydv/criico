import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { signSession, verifySession, type SessionPayload } from "./jwt";
import { safeRedirectPath } from "./redirect";

const session: SessionPayload = {
  sub: "64b7f0c2a1b2c3d4e5f60001",
  name: "Admin",
  email: "admin@criico.dev",
  role: "ADMIN",
};

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
});

describe("session JWT", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession(session);
    expect(await verifySession(token)).toEqual(session);
  });

  it("rejects a token whose payload was tampered with", async () => {
    const [header, , signature] = (await signSession(session)).split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ ...session, role: "ADMIN", sub: "attacker" })).toString("base64url");
    expect(await verifySession(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const foreign = await new SignJWT({ name: "x", email: "x@y.z", role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("someone")
      .setIssuer("criico")
      .setAudience("criico-dashboard")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("another-secret-another-secret-another-secret"));
    expect(await verifySession(foreign)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ name: "x", email: "x@y.z", role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("someone")
      .setIssuer("criico")
      .setAudience("criico-dashboard")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    expect(await verifySession(expired)).toBeNull();
  });

  it("returns null for missing or garbage tokens", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  it("keeps internal paths", () => {
    expect(safeRedirectPath("/dashboard/players?x=1")).toBe("/dashboard/players?x=1");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "", null, undefined])(
    "falls back to /dashboard for %s",
    (from) => {
      expect(safeRedirectPath(from)).toBe("/dashboard");
    },
  );
});
