import { db, sessions, users } from '@speakle/db';
import { eq, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const token = createId() + createId(); // ~44 chars of entropy
  const now = Date.now();

  const [session] = await db
    .insert(sessions)
    .values({
      id: createId(),
      userId,
      token,
      expiresAt: now + SESSION_DURATION_MS,
      ipAddress,
      userAgent,
      createdAt: now,
    })
    .returning();

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
