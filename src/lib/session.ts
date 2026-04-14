import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "./auth";
import type { JwtPayload } from "./types";

/** Reads the session JWT from a request cookie and returns the payload, or null. */
export async function getSession(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
