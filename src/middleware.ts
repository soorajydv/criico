import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { DEFAULT_AFTER_LOGIN } from "@/lib/auth/redirect";

const AUTH_PAGES = new Set(["/login", "/register"]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  // Verify the signature, not just the cookie's presence: a forged or expired
  // token must not get past this point.
  const session = await verifySession(token);

  if (pathname.startsWith("/dashboard") && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE); // clear the stale/invalid token
    return response;
  }

  if (AUTH_PAGES.has(pathname) && session) {
    return NextResponse.redirect(new URL(DEFAULT_AFTER_LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/register"],
};
