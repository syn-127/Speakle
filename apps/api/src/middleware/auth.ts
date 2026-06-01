import { createMiddleware } from 'hono/factory';
import { validateSession } from '../lib/auth.js';
import type { User } from '@speakle/shared';

type AuthEnv = {
  Variables: {
    user: User;
    sessionToken: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const cookieToken = getCookieToken(c.req.raw);

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const result = await validateSession(token);
  if (!result) {
    return c.json({ error: 'Session expired or invalid' }, 401);
  }

  const { user } = result;
  c.set('user', {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    displayName: user.displayName,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
  c.set('sessionToken', token);

  return await next();
});

export const adminOnly = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  return await next();
});

function getCookieToken(req: Request): string | null {
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/speakle_session=([^;]+)/);
  return match ? (match[1] ?? null) : null;
}
