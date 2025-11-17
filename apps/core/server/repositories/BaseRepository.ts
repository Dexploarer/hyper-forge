/**
 * Base Repository
 * Generic CRUD operations and common query patterns for Drizzle ORM
 *
 * This base class abstracts common database operations to reduce code duplication
 * across repository implementations while maintaining full type safety.
 *
 * @example
 * ```typescript
 * export class UserRepository extends BaseRepository<typeof users> {
 *   constructor() {
 *     super(users, 'UserRepository');
 *   }
 *
 *   // Add domain-specific methods
 *   async findByEmail(email: string) {
 *     return this.findOne({ email: eq(users.email, email) });
 *   }
 * }
 * ```
 */

import { db } from "../db/db";
import { logger } from "../utils/logger";
import { eq, and, desc, SQL, count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Type helpers for Drizzle table inference
 */
type InferSelectModel<T extends PgTable> = T["$inferSelect"];
type InferInsertModel<T extends PgTable> = T["$inferInsert"];

/**
 * Base query options for filtering and pagination
 */
export interface BaseQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: SQL[];
}

/**
 * Filter condition for dynamic queries
 */
export interface FilterCondition {
  [key: string]: SQL | undefined;
}

/**
 * Generic Base Repository
 * Provides CRUD operations and common query patterns
 *
 * @template T - Drizzle table type
 */
export abstract class BaseRepository<T extends PgTable> {
  protected table: T;
  protected tableName: string;
  protected repositoryName: string;

  /**
   * Constructor
   * @param table - Drizzle table definition
   * @param repositoryName - Name for logging (e.g., 'UserRepository')
   */
  constructor(table: T, repositoryName: string) {
    this.table = table;
    this.tableName = (table as any)[Symbol.for("drizzle:Name")] || "unknown";
    this.repositoryName = repositoryName;
  }

  /**
   * Create a new record
   * @param data - Insert data
   * @returns Created record
   */
  async create(data: InferInsertModel<T>): Promise<InferSelectModel<T>> {
    try {
      const [created] = await db
        .insert(this.table as any)
        .values(data as any)
        .returning();

      logger.info(
        { id: (created as any).id, table: this.tableName },
        `[${this.repositoryName}] Record created`,
      );

      return created as InferSelectModel<T>;
    } catch (error) {
      logger.error(
        { err: error, table: this.tableName },
        `[${this.repositoryName}] Failed to create record`,
      );
      throw error;
    }
  }

  /**
   * Find a record by ID
   * @param id - Record ID
   * @returns Record or null if not found
   */
  async findById(id: string): Promise<InferSelectModel<T> | null> {
    try {
      const idColumn = (this.table as any).id;
      if (!idColumn) {
        throw new Error(`Table ${this.tableName} does not have an 'id' column`);
      }

      const [record] = await db
        .select()
        .from(this.table as any)
        .where(eq(idColumn, id))
        .limit(1);

      return (record as InferSelectModel<T>) || null;
    } catch (error) {
      logger.error(
        { err: error, id, table: this.tableName },
        `[${this.repositoryName}] Failed to find record by ID`,
      );
      throw error;
    }
  }

  /**
   * Find a single record matching conditions
   * @param conditions - Filter conditions
   * @returns Record or null if not found
   */
  async findOne(
    conditions: FilterCondition,
  ): Promise<InferSelectModel<T> | null> {
    try {
      const whereConditions = this.buildWhereConditions(conditions);

      let query = db
        .select()
        .from(this.table as any)
        .$dynamic();

      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      const [record] = await query.limit(1);

      return (record as InferSelectModel<T>) || null;
    } catch (error) {
      logger.error(
        { err: error, conditions, table: this.tableName },
        `[${this.repositoryName}] Failed to find one record`,
      );
      throw error;
    }
  }

  /**
   * Find multiple records with filtering and pagination
   * @param conditions - Filter conditions
   * @param options - Query options (limit, offset, orderBy)
   * @returns Array of records
   */
  async findMany(
    conditions: FilterCondition = {},
    options: BaseQueryOptions = {},
  ): Promise<InferSelectModel<T>[]> {
    try {
      const whereConditions = this.buildWhereConditions(conditions);

      let query = db
        .select()
        .from(this.table as any)
        .$dynamic();

      // Apply filters
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      // Apply ordering (default to createdAt desc if exists)
      if (options.orderBy && options.orderBy.length > 0) {
        query = query.orderBy(...options.orderBy);
      } else {
        const createdAtColumn = (this.table as any).createdAt;
        if (createdAtColumn) {
          query = query.orderBy(desc(createdAtColumn));
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.offset(options.offset);
      }

      const records = await query;

      return records as InferSelectModel<T>[];
    } catch (error) {
      logger.error(
        { err: error, conditions, options, table: this.tableName },
        `[${this.repositoryName}] Failed to find many records`,
      );
      throw error;
    }
  }

  /**
   * Update a record by ID
   * @param id - Record ID
   * @param data - Update data
   * @returns Updated record or null if not found
   */
  async update(
    id: string,
    data: Partial<InferInsertModel<T>>,
  ): Promise<InferSelectModel<T> | null> {
    try {
      const idColumn = (this.table as any).id;
      if (!idColumn) {
        throw new Error(`Table ${this.tableName} does not have an 'id' column`);
      }

      // Auto-update updatedAt if column exists
      const updatedAtColumn = (this.table as any).updatedAt;
      const updateData = updatedAtColumn
        ? { ...data, updatedAt: new Date() as any }
        : data;

      const [updated] = await db
        .update(this.table as any)
        .set(updateData as any)
        .where(eq(idColumn, id))
        .returning();

      if (updated) {
        logger.debug(
          { id, table: this.tableName },
          `[${this.repositoryName}] Record updated`,
        );
      }

      return (updated as InferSelectModel<T>) || null;
    } catch (error) {
      logger.error(
        { err: error, id, table: this.tableName },
        `[${this.repositoryName}] Failed to update record`,
      );
      throw error;
    }
  }

  /**
   * Delete a record by ID
   * @param id - Record ID
   * @returns Deleted record or null if not found
   */
  async delete(id: string): Promise<InferSelectModel<T> | null> {
    try {
      const idColumn = (this.table as any).id;
      if (!idColumn) {
        throw new Error(`Table ${this.tableName} does not have an 'id' column`);
      }

      const [deleted] = await db
        .delete(this.table as any)
        .where(eq(idColumn, id))
        .returning();

      if (deleted) {
        logger.info(
          { id, table: this.tableName },
          `[${this.repositoryName}] Record deleted`,
        );
      }

      return (deleted as InferSelectModel<T>) || null;
    } catch (error) {
      logger.error(
        { err: error, id, table: this.tableName },
        `[${this.repositoryName}] Failed to delete record`,
      );
      throw error;
    }
  }

  /**
   * Count records matching conditions
   * @param conditions - Filter conditions
   * @returns Count of matching records
   */
  async count(conditions: FilterCondition = {}): Promise<number> {
    try {
      const whereConditions = this.buildWhereConditions(conditions);

      let query = db
        .select({ count: count() })
        .from(this.table as any)
        .$dynamic();

      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      const [result] = await query;

      return Number(result.count);
    } catch (error) {
      logger.error(
        { err: error, conditions, table: this.tableName },
        `[${this.repositoryName}] Failed to count records`,
      );
      throw error;
    }
  }

  /**
   * Check if a record exists by ID
   * @param id - Record ID
   * @returns True if record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const record = await this.findById(id);
      return record !== null;
    } catch (error) {
      logger.error(
        { err: error, id, table: this.tableName },
        `[${this.repositoryName}] Failed to check if record exists`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE conditions from filter object
   * Filters out undefined values
   * @param conditions - Filter conditions
   * @returns Array of SQL conditions
   */
  protected buildWhereConditions(conditions: FilterCondition): SQL[] {
    const whereConditions: SQL[] = [];

    for (const [key, condition] of Object.entries(conditions)) {
      if (condition !== undefined) {
        whereConditions.push(condition);
      }
    }

    return whereConditions;
  }

  /**
   * Execute a custom query with error handling and logging
   * @param queryFn - Query function to execute
   * @param operation - Operation name for logging
   * @returns Query result
   */
  protected async executeQuery<R>(
    queryFn: () => Promise<R>,
    operation: string,
  ): Promise<R> {
    try {
      return await queryFn();
    } catch (error) {
      logger.error(
        { err: error, operation, table: this.tableName },
        `[${this.repositoryName}] Query execution failed`,
      );
      throw error;
    }
  }
}
