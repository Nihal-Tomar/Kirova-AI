import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";
import { config } from "../config/env";

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

class DatabaseService {
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
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
    const dataDir = path.resolve(__dirname, "../../data/pgdata");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.pglite = new PGlite(dataDir);
    this.isEmbeddedPostgres = true;
    console.log(`✅ [DATABASE] Initialized embedded PostgreSQL (PGlite) with persistence at: ${dataDir}`);
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
