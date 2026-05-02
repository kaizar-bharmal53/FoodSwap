import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, COOKIE_NAME } from "@/lib/auth-edge";

// Routes that require a valid session (any role).
const PROTECTED = ["/checkout", "/orders", "/account"];

// Routes that require a valid session AND role === "admin".
// Non-admins are bounced to "/" instead of "/login" to avoid leaking that the route exists.
const ADMIN_ONLY = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth  = PROTECTED.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p));

  if (!needsAuth && !needsAdmin) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  // Not authenticated — redirect to login for both cases.
  if (!payload) {
    const login = new URL("/login", req.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  // Authenticated but not an admin — redirect to home page.
  if (needsAdmin && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout", "/checkout/:path*",
    "/orders",   "/orders/:path*",
    "/account",  "/account/:path*",
    "/admin",    "/admin/:path*",
  ],
};
