import Database from 'better-sqlite3';
import * as schema from './schema/index';
export declare let db: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: Database.Database;
};
export declare function setDb(newDb: typeof db): void;
export type DB = typeof db;
//# sourceMappingURL=client.d.ts.map