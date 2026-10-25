import { Pool } from "pg";
import path from "path";
import fs from "fs";
import { config } from "../config/env";

interface EmbeddedDatabase {
  query<T>(text: string, params: any[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
  close(): Promise<void>;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

class DatabaseService {
  private pool: Pool | null = null;
  private pglite: EmbeddedDatabase | null = null;
  private isConnected = false;
  public isEmbeddedPostgres = false;

  async init(): Promise<void> {
    if (this.isConnected) return;

    if (config.databaseUrl && (config.databaseUrl.startsWith("postgres://") || config.databaseUrl.startsWith("postgresql://"))) {
      try {
        this.pool = new Pool({
          connectionString: config.databaseUrl,
          ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined
        });
        await this.pool.query("SELECT 1");
        this.isEmbeddedPostgres = false;
        console.log("✅ [DATABASE] Connected to external PostgreSQL via Pool.");
      } catch (err: any) {
        if (config.nodeEnv === "production") {
          throw new Error(`FATAL: Failed to connect to production PostgreSQL: ${err.message}`);
        }
        console.warn(`⚠️  [DATABASE] Failed to connect to external PostgreSQL (${err.message}). Falling back to embedded PostgreSQL.`);
        await this.initEmbedded();
      }
    } else {
      await this.initEmbedded();
    }

    this.isConnected = true;
  }

  private async initEmbedded(): Promise<void> {
    const { PGlite: PGliteConstructor } = await import("@electric-sql/pglite");
    this.isEmbeddedPostgres = true;

    if (process.env.NODE_ENV === "test" || config.nodeEnv === "test") {
      this.pglite = new PGliteConstructor();
      console.log("✅ [DATABASE] Initialized fast in-memory PostgreSQL (PGlite) for test suite.");
      return;
    }

    const dataDir = path.resolve(__dirname, "../../data/pgdata");
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      } else {
        // Clean up stale lock files from previous abrupt process exit
        const staleFiles = ["postmaster.pid", ".s.PGSQL.5432.lock.out"];
        for (const f of staleFiles) {
          const fp = path.join(dataDir, f);
          if (fs.existsSync(fp)) {
            try { fs.unlinkSync(fp); } catch {}
          }
        }
      }
      this.pglite = new PGliteConstructor(dataDir);
      // Verify readiness
      await this.pglite.query("SELECT 1", []);
      console.log(`✅ [DATABASE] Initialized embedded PostgreSQL (PGlite) with persistence at: ${dataDir}`);
    } catch (err: any) {
      console.warn(`⚠️  [DATABASE] Could not initialize persistent PGlite at ${dataDir} (${err.message}). Using in-memory database.`);
      this.pglite = new PGliteConstructor();
    }
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.isConnected) {
      await this.init();
    }

    // Convert undefined values in params to null for SQL compatibility
    const sanitizedParams = params.map(p => (p === undefined ? null : p));

    if (this.pool) {
      const res = await this.pool.query(text, sanitizedParams);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount ?? res.rows.length
      };
    } else if (this.pglite) {
      const res = await this.pglite.query<T>(text, sanitizedParams);
      return {
        rows: res.rows,
        rowCount: res.rows.length
      };
    }

    throw new Error("Database not initialized");
  }

  async executeScript(sql: string): Promise<void> {
    if (!this.isConnected) {
      await this.init();
    }

    if (this.pool) {
      await this.pool.query(sql);
    } else if (this.pglite) {
      await this.pglite.exec(sql);
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.pglite) {
      await this.pglite.close();
      this.pglite = null;
    }
    this.isConnected = false;
  }
}

export const db = new DatabaseService();
