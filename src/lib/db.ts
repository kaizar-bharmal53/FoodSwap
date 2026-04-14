import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  // Build the pg.Pool config by parsing the URL manually so we can force
  // ssl.rejectUnauthorized=false. Passing the raw connectionString causes
  // pg-connection-string to inject ssl:{} for sslmode=require, which pg v8
  // treats as verify-full and rejects DigitalOcean's self-signed cert.
  const raw = new URL(getDatabaseUrl());
  const pool = new pg.Pool({
    host: raw.hostname,
    port: Number(raw.port) || 5432,
    user: decodeURIComponent(raw.username),
    password: decodeURIComponent(raw.password),
    database: raw.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db: PrismaClient = global._prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global._prisma = db;
}
