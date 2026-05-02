import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { JwtPayload, User, UserRole } from "./types";
import { db } from "./db";
import { COOKIE_NAME, SESSION_MAX_AGE_SEC, JWT_ISSUER, JWT_AUDIENCE } from "./constants";

// ─── Config ───────────────────────────────────────────────────────────────────

// Re-export so existing importers of COOKIE_NAME from this module keep working.
export { COOKIE_NAME, SESSION_MAX_AGE_SEC };

/** HttpOnly cookie storing guest cart id (UUID); cleared on login after merge. */
export const GUEST_CART_COOKIE = "guest_cart_id";
export const GUEST_CART_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

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

// ─── User operations ──────────────────────────────────────────────────────────

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = "customer"
): Promise<User | null> {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(password, 10);
  const row = await db.user.create({
    data: { name, email, passwordHash, role },
  });
  return toPublicUser(row);
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const row = await db.user.findUnique({ where: { email } });
  if (!row) return null;

  const ok = await bcrypt.compare(password, row.passwordHash);
  return ok ? toPublicUser(row) : null;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const row = await db.user.findUnique({ where: { id } });
  return row ? toPublicUser(row) : undefined;
}

export async function updateUser(
  id: string,
  data: { name?: string; password?: string }
): Promise<User | null> {
  const update: Record<string, string> = {};
  if (data.name?.trim()) update.name = data.name.trim();
  if (data.password) update.passwordHash = await bcrypt.hash(data.password, 10);
  if (!Object.keys(update).length) return null;
  const row = await db.user.update({ where: { id }, data: update });
  return toPublicUser(row);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: new Date(u.createdAt).toISOString(),
  };
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signToken(user: User): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
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

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function makeSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
