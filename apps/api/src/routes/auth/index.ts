import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db, users } from '@speakle/db';
import { eq } from 'drizzle-orm';
import { loginSchema, changePasswordSchema } from '@speakle/shared';
import {
  createSession,
  deleteSession,
  verifyPassword,
  hashPassword,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
} from '../../lib/auth.js';
import { authMiddleware } from '../../middleware/auth.js';
import { dbv } from '../../lib/db-helpers.js';

export const authRouter = new Hono();

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown';
  const rateLimitKeys = [`ip:${ip}`, `email:${email.toLowerCase()}`];

  const rateLimit = await checkLoginRateLimit(rateLimitKeys);
  if (!rateLimit.allowed) {
    c.header('Retry-After', String(rateLimit.retryAfterSeconds));
    return c.json({ error: 'Too many login attempts. Try again later.' }, 429);
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = result[0];

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailedLogin(rateLimitKeys);
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  await clearLoginAttempts(rateLimitKeys);

  const session = await createSession(
    user.id,
    c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
    c.req.header('user-agent'),
  );

  c.header('Set-Cookie', `speakle_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`);

  return c.json({
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  });
});

authRouter.post('/logout', authMiddleware, async (c) => {
  const token = c.get('sessionToken');
  await deleteSession(token);
  c.header('Set-Cookie', 'speakle_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  return c.json({ success: true });
});

authRouter.get('/session', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

authRouter.post('/change-password', authMiddleware, zValidator('json', changePasswordSchema), async (c) => {
  const { currentPassword, newPassword } = c.req.valid('json');
  const currentUser = c.get('user');

  const result = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);
  const user = result[0];
  if (!user) return c.json({ error: 'User not found' }, 404);

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return c.json({ error: 'Current password is incorrect' }, 400);
  }

  const newHash = await hashPassword(newPassword);
  await db.update(users).set(dbv({ passwordHash: newHash, updatedAt: Date.now() })).where(eq(users.id, user.id));

  return c.json({ success: true });
});
