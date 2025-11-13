/**
 * Base Repository
 * Generic repository class providing common CRUD operations
 * All repositories should extend this for consistency
 */

import { db } from "../db/db";
import {
  SQL,
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { PgSelect } from "drizzle-orm/pg-core";
import { logger } from "../utils/logger";

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
  orderBy?: "asc" | "desc";
  orderByColumn?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total?: number;
    limit: number;
    offset?: number;
    cursor?: string;
    hasMore: boolean;
  };
}

/**
 * Filter options
 */
export interface FilterOptions {
  where?: SQL;
  orderBy?: SQL;
  limit?: number;
  offset?: number;
}

/**
 * Base Repository class with generic CRUD operations
 *
 * @template TTable - The Drizzle table type
 * @template TSelect - The select model inferred from the table
 * @template TInsert - The insert model inferred from the table
 */
export abstract class BaseRepository<
  TTable extends PgTable,
  TSelect = InferSelectModel<TTable>,
  TInsert = InferInsertModel<TTable>,
> {
  constructor(protected table: TTable) {}

  /**
   * Find all records with optional filtering and pagination
   */
  async findMany(options?: FilterOptions): Promise<TSelect[]> {
    try {
      let query = db.select().from(this.table).$dynamic();

      if (options?.where) {
        query = query.where(options.where);
      }

      if (options?.orderBy) {
        query = query.orderBy(options.orderBy);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      return query as Promise<TSelect[]>;
    } catch (err) {
      logger.error({ err, table: this.table }, "Failed to find many records");
      throw err;
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<TSelect | undefined> {
    try {
      const idColumn = this.table.id;
      const [record] = await db
        .select()
        .from(this.table)
        .where(eq(idColumn, id))
        .limit(1);

      return record as TSelect | undefined;
    } catch (err) {
      logger.error(
        { err, id, table: this.table },
        "Failed to find record by ID",
      );
      throw err;
    }
  }

  /**
   * Find a single record by custom condition
   */
  async findOne(where: SQL): Promise<TSelect | undefined> {
    try {
      const [record] = await db.select().from(this.table).where(where).limit(1);

      return record as TSelect | undefined;
    } catch (err) {
      logger.error({ err, table: this.table }, "Failed to find one record");
      throw err;
    }
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<TSelect> {
    try {
      const [record] = await db.insert(this.table).values(data).returning();

      return record as TSelect;
    } catch (err) {
      logger.error({ err, data, table: this.table }, "Failed to create record");
      throw err;
    }
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<TSelect[]> {
    try {
      const records = await db.insert(this.table).values(data).returning();

      return records as TSelect[];
    } catch (err) {
      logger.error(
        { err, count: data.length, table: this.table },
        "Failed to create multiple records",
      );
      throw err;
    }
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: Partial<TInsert>,
  ): Promise<TSelect | undefined> {
    try {
      const idColumn = this.table.id;
      const [record] = await db
        .update(this.table)
        .set(data as any)
        .where(eq(idColumn, id))
        .returning();

      return record as TSelect | undefined;
    } catch (err) {
      logger.error(
        { err, id, data, table: this.table },
        "Failed to update record",
      );
      throw err;
    }
  }

  /**
   * Update records matching condition
   */
  async updateMany(where: SQL, data: Partial<TInsert>): Promise<TSelect[]> {
    try {
      const records = await db
        .update(this.table)
        .set(data as any)
        .where(where)
        .returning();

      return records as TSelect[];
    } catch (err) {
      logger.error(
        { err, data, table: this.table },
        "Failed to update many records",
      );
      throw err;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const idColumn = this.table.id;
      const result = await db.delete(this.table).where(eq(idColumn, id));

      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error({ err, id, table: this.table }, "Failed to delete record");
      throw err;
    }
  }

  /**
   * Delete records matching condition
   */
  async deleteMany(where: SQL): Promise<number> {
    try {
      const result = await db.delete(this.table).where(where);

      return result.rowCount ?? 0;
    } catch (err) {
      logger.error({ err, table: this.table }, "Failed to delete many records");
      throw err;
    }
  }

  /**
   * Count records matching condition
   */
  async count(where?: SQL): Promise<number> {
    try {
      let query = db.select({ count: sql<number>`count(*)` }).from(this.table);

      if (where) {
        query = query.where(where) as any;
      }

      const [result] = await query;
      return Number(result?.count ?? 0);
    } catch (err) {
      logger.error({ err, table: this.table }, "Failed to count records");
      throw err;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(where: SQL): Promise<boolean> {
    try {
      const count = await this.count(where);
      return count > 0;
    } catch (err) {
      logger.error({ err, table: this.table }, "Failed to check existence");
      throw err;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
    try {
      return await db.transaction(callback);
    } catch (err) {
      logger.error({ err, table: this.table }, "Transaction failed");
      throw err;
    }
  }
}
