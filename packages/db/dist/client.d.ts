import Database from 'better-sqlite3';
import * as schema from './schema/index';
declare function createLocalDb(): import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: Database.Database;
};
export declare let db: ReturnType<typeof createLocalDb>;
export declare function setDb(newDb: typeof db): void;
export type DB = typeof db;
export {};
//# sourceMappingURL=client.d.ts.map