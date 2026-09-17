import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "photo-sharing-platform-jwt-secret-key-default-32chars"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin dashboard routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("psp_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "ADMIN") {
        // Forbidden: redirect to team dashboard or login
        return NextResponse.redirect(new URL("/team/events", request.url));
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Team dashboard routes
  if (pathname.startsWith("/team")) {
    const token = request.cookies.get("psp_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/team/:path*"],
};
