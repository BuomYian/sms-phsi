import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it in your .env file.",
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const COOKIE_NAME = "phsi-session";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/forgot-password"];

// Route permissions mapping
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard": [
    "SUPER_ADMIN",
    "ADMIN",
    "FINANCE",
    "INSTRUCTOR",
    "STUDENT",
    "PARENT",
  ],
  "/students": ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "PARENT"],
  "/staff": ["SUPER_ADMIN", "ADMIN"],
  "/parents": ["SUPER_ADMIN", "ADMIN"],
  "/academics": ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"],
  // "/enrollment": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/timetable": ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"],
  "/attendance": ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"],
  "/grades": ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"],
  "/fees": ["SUPER_ADMIN", "ADMIN", "FINANCE", "STUDENT"],
  "/announcements": [
    "SUPER_ADMIN",
    "ADMIN",
    "FINANCE",
    "INSTRUCTOR",
    "STUDENT",
    "PARENT",
  ],
  "/messages": ["SUPER_ADMIN", "ADMIN", "FINANCE", "INSTRUCTOR", "STUDENT"],
  "/reports": ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  "/settings": ["SUPER_ADMIN", "ADMIN"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and static assets
  if (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    // If user is logged in and visits login page, redirect to dashboard
    if (pathname === "/login" || pathname === "/") {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token) {
        try {
          await jwtVerify(token, JWT_SECRET);
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } catch {
          // Token invalid, let them proceed to login
        }
      }
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    // Check route permissions
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) =>
      pathname.startsWith(route),
    );

    if (matchedRoute) {
      const allowedRoles = ROUTE_PERMISSIONS[matchedRoute];
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Refresh token if within 24 hours of expiry
    const response = NextResponse.next();
    const exp = payload.exp ?? 0;
    const hoursUntilExpiry = (exp * 1000 - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilExpiry < 24 && hoursUntilExpiry > 0) {
      const newToken = await new SignJWT({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        fullName: payload.fullName,
        avatarUrl: payload.avatarUrl,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET);

      response.cookies.set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // Add user info to headers for downstream use
    response.headers.set("x-user-id", payload.sub as string);
    response.headers.set("x-user-role", userRole);
    return response;
  } catch {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
