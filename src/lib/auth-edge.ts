/**
 * Edge-compatible JWT verification using `jose`.
 * Import this in middleware.ts — NOT auth.ts (which uses jsonwebtoken/bcryptjs).
 */
import { jwtVerify } from "jose";
import type { JwtPayload } from "./types";

export const COOKIE_NAME = "pos_session";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
