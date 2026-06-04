// middleware.ts — Protect /admin/* with NextAuth session
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROLES = ["ADMIN_DATA", "SUPER_ADMIN"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* (not /api/agent/* which needs cron access)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
