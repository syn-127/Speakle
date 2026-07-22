import { db, sessions, users, loginAttempts } from '@speakle/db';
import { eq, gt, lt, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 8;

export async function checkLoginRateLimit(
  identifiers: string[],
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  const windowStart = now - LOGIN_ATTEMPT_WINDOW_MS;

  // Opportunistic cleanup so the table doesn't grow unbounded.
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, windowStart));

  for (const identifier of identifiers) {
    const attempts = await db
      .select()
      .from(loginAttempts)
      .where(and(eq(loginAttempts.identifier, identifier), gt(loginAttempts.createdAt, windowStart)));

    if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
      const oldest = Math.min(...attempts.map((a) => a.createdAt));
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + LOGIN_ATTEMPT_WINDOW_MS - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordFailedLogin(identifiers: string[]) {
  const now = Date.now();
  await db.insert(loginAttempts).values(identifiers.map((identifier) => ({ id: createId(), identifier, createdAt: now })));
}

export async function clearLoginAttempts(identifiers: string[]) {
  for (const identifier of identifiers) {
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier));
  }
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const token = createId() + createId(); // ~44 chars of entropy
  const now = Date.now();

  const sessionRow = {
    id: createId(),
    userId,
    token,
    expiresAt: now + SESSION_DURATION_MS,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    createdAt: now,
  };

  const [session] = await db.insert(sessions).values(sessionRow).returning();

  return session!;
}

export async function validateSession(token: string) {
  const now = Date.now();

  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  const session = result[0];
  if (!session || session.expiresAt < now) return null;

  const userResult = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userResult[0];
  if (!user) return null;

  return { session, user };
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function verifyPassword(plaintext: string, hash: string) {
  return bcrypt.compare(plaintext, hash);
}

export async function hashPassword(plaintext: string) {
  return bcrypt.hash(plaintext, 12);
}
