import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, COOKIE_NAME } from "@/lib/auth-edge";

// /cart is NOT protected — anyone can build a cart without logging in.
// /checkout and /orders require authentication.
const PROTECTED = ["/checkout", "/orders", "/account"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  if (!payload) {
    const login = new URL("/login", req.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout", "/checkout/:path*", "/orders", "/orders/:path*", "/account", "/account/:path*"],
};
