/**
 * Edge-compatible JWT verification using `jose`.
 * Import this in middleware.ts — NOT auth.ts (which uses bcryptjs/Prisma).
 */
import { jwtVerify } from "jose";
import type { JwtPayload } from "./types";
import { COOKIE_NAME, JWT_ISSUER, JWT_AUDIENCE } from "./constants";

// Re-export so middleware.ts can import COOKIE_NAME from here.
export { COOKIE_NAME };

function buildSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    throw new Error(
      "JWT_SECRET environment variable is not set. Generate one with: openssl rand -base64 48"
    );
  }
  if (raw.length < 32) {
    throw new Error(
      `JWT_SECRET is too short (${raw.length} chars). Minimum is 32 characters.`
    );
  }
  return new TextEncoder().encode(raw);
}

const secret = buildSecret();

export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
