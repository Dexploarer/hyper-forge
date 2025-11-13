/**
 * Pagination Utilities
 * Type-safe helpers for cursor and offset-based pagination with Drizzle ORM
 */

import { SQL, sql, desc, asc, gt, lt } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";

/**
 * Cursor pagination options
 */
export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  direction?: "forward" | "backward";
  orderBy?: "asc" | "desc";
}

/**
 * Offset pagination options
 */
export interface OffsetPaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
  total?: number;
  page?: number;
  limit: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Apply cursor-based pagination to a Drizzle query
 *
 * @param qb - The Drizzle query builder (use .$dynamic())
 * @param cursorColumn - The column to use for cursor (e.g., table.createdAt)
 * @param options - Pagination options
 * @returns Modified query with cursor pagination applied
 *
 * @example
 * ```ts
 * const query = db.select().from(users).$dynamic();
 * const paginatedQuery = withCursorPagination(
 *   query,
 *   users.createdAt,
 *   { cursor: 'cursor_value', limit: 20 }
 * );
 * const results = await paginatedQuery;
 * ```
 */
export function withCursorPagination<T extends PgSelect>(
  qb: T,
  cursorColumn: any,
  options: CursorPaginationOptions = {},
): T {
  const {
    cursor,
    limit = 20,
    direction = "forward",
    orderBy = "desc",
  } = options;

  let query = qb;

  // Apply cursor condition
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (direction === "forward") {
      query = (
        orderBy === "desc"
          ? query.where(lt(cursorColumn, cursorDate))
          : query.where(gt(cursorColumn, cursorDate))
      ) as T;
    } else {
      query = (
        orderBy === "desc"
          ? query.where(gt(cursorColumn, cursorDate))
          : query.where(lt(cursorColumn, cursorDate))
      ) as T;
    }
  }

  // Apply ordering
  query = (
    orderBy === "desc"
      ? query.orderBy(desc(cursorColumn))
      : query.orderBy(asc(cursorColumn))
  ) as T;

  // Apply limit (fetch one extra to check if there are more)
  query = query.limit(limit + 1) as T;

  return query;
}

/**
 * Apply offset-based pagination to a Drizzle query
 *
 * @param qb - The Drizzle query builder (use .$dynamic())
 * @param options - Pagination options
 * @returns Modified query with offset pagination applied
 *
 * @example
 * ```ts
 * const query = db.select().from(users).$dynamic();
 * const paginatedQuery = withOffsetPagination(query, { page: 2, limit: 20 });
 * const results = await paginatedQuery;
 * ```
 */
export function withOffsetPagination<T extends PgSelect>(
  qb: T,
  options: OffsetPaginationOptions = {},
): T {
  const { page = 1, limit = 20 } = options;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Apply limit and offset
  let query = qb.limit(limit) as T;
  if (offset > 0) {
    query = query.offset(offset) as T;
  }

  return query;
}

/**
 * Build pagination metadata from query results
 *
 * @param items - The query results
 * @param limit - The limit used in the query
 * @param cursorColumn - Optional cursor column name for cursor pagination
 * @param page - Optional page number for offset pagination
 * @returns Pagination metadata
 *
 * @example
 * ```ts
 * const results = await paginatedQuery;
 * const metadata = buildPaginationMetadata(results, 20, 'createdAt');
 * const data = results.slice(0, 20); // Remove extra item
 * return { data, pagination: metadata };
 * ```
 */
export function buildPaginationMetadata<T extends Record<string, any>>(
  items: T[],
  limit: number,
  cursorColumn?: string,
  page?: number,
): PaginationMetadata {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  const metadata: PaginationMetadata = {
    hasMore,
    limit,
  };

  // Add cursor pagination metadata
  if (cursorColumn && data.length > 0) {
    const lastItem = data[data.length - 1];
    const firstItem = data[0];

    // Next cursor is the last item's cursor value
    if (hasMore && lastItem[cursorColumn]) {
      metadata.nextCursor = lastItem[cursorColumn].toISOString
        ? lastItem[cursorColumn].toISOString()
        : String(lastItem[cursorColumn]);
    }

    // Previous cursor is the first item's cursor value
    if (firstItem[cursorColumn]) {
      metadata.prevCursor = firstItem[cursorColumn].toISOString
        ? firstItem[cursorColumn].toISOString()
        : String(firstItem[cursorColumn]);
    }
  }

  // Add offset pagination metadata
  if (page !== undefined) {
    metadata.page = page;
  }

  return metadata;
}

/**
 * Create a paginated response
 *
 * @param items - The query results
 * @param limit - The limit used in the query
 * @param cursorColumn - Optional cursor column name for cursor pagination
 * @param page - Optional page number for offset pagination
 * @returns Paginated result with data and metadata
 *
 * @example
 * ```ts
 * const results = await paginatedQuery;
 * return createPaginatedResponse(results, 20, 'createdAt');
 * ```
 */
export function createPaginatedResponse<T extends Record<string, any>>(
  items: T[],
  limit: number,
  cursorColumn?: string,
  page?: number,
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const pagination = buildPaginationMetadata(items, limit, cursorColumn, page);

  return {
    data,
    pagination,
  };
}

/**
 * Encode cursor from object values
 *
 * @param values - Object with cursor values
 * @returns Base64 encoded cursor string
 *
 * @example
 * ```ts
 * const cursor = encodeCursor({ createdAt: new Date(), id: 'abc123' });
 * ```
 */
export function encodeCursor(values: Record<string, any>): string {
  const json = JSON.stringify(values);
  return Buffer.from(json).toString("base64");
}

/**
 * Decode cursor to object values
 *
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor values
 *
 * @example
 * ```ts
 * const values = decodeCursor(cursor);
 * console.log(values.createdAt, values.id);
 * ```
 */
export function decodeCursor(cursor: string): Record<string, any> {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (err) {
    throw new Error("Invalid cursor format");
  }
}
