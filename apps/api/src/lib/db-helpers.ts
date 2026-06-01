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
