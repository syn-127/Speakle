/**
 * Casts drizzle update/insert values to bypass the TS2353/TS2559 "no properties in common"
 * error that occurs in pnpm monorepos when drizzle-orm resolves to two peer-dep instances
 * (one with @libsql/client, one without). At runtime the values are correct; the cast is
 * purely a compile-time workaround.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbv<T extends object>(v: T): any {
  return v;
}

/**
 * Casts the output of `c.req.valid()` (typed by @hono/zod-validator against its own Zod
 * instance) to the equivalent type from @speakle/shared (typed by a different Zod instance
 * in pnpm@10 on Vercel). At runtime the value is identical; this is purely a compile-time
 * bridge between the two Zod peer-dep instances.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validated<T>(v: unknown): T {
  return v as T;
}
