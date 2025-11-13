# Transaction-Based Test Isolation Guide

## Overview

Transaction-based test isolation ensures that database changes made during tests are automatically rolled back, preventing data pollution between tests. This eliminates the need for manual cleanup in `beforeEach`/`afterEach` hooks.

## Why Transaction Isolation?

**Problems with Manual Cleanup:**

- If a test fails mid-execution, cleanup may not run
- Tests can interfere with each other
- Slower execution due to DELETE operations
- More code to maintain (cleanup logic in every test)

**Benefits of Transaction Isolation:**

- Automatic rollback on test completion (success or failure)
- Faster execution (rollback is faster than DELETE)
- No test interference - each test gets a clean slate
- Less boilerplate code

## Implementation Approaches

### Approach 1: Manual Cleanup (Current - Less Ideal)

Due to postgres.js connection pooling limitations with the current setup, we use enhanced manual cleanup:

```typescript
import { setupTestTransaction, type TestContext } from "../../../helpers/db";

describe("MyService", () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    testCtx = await setupTestTransaction();
  });

  afterEach(async () => {
    await testCtx.rollback(); // Manually deletes test data
  });

  it("should create user", async () => {
    const [user] = await testCtx.db
      .insert(users)
      .values({...})
      .returning();

    expect(user).toBeDefined();
    // Cleanup happens automatically in afterEach
  });
});
```

**Limitations:**

- Still uses DELETE operations (not true rollback)
- Must use consistent naming for test data (test-\* prefixes)
- Slightly slower than true transaction rollback

### Approach 2: Function-Wrapped Transactions (Recommended for Simple Tests)

For individual tests that don't need shared setup:

```typescript
import { withTestTransaction } from "../../../helpers/db";
import { users } from "../../../../server/db/schema";

describe("MyService", () => {
  it("should create user", async () => {
    await withTestTransaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          privyUserId: "test-user",
          email: "test@example.com",
        })
        .returning();

      expect(user).toBeDefined();
      expect(user.email).toBe("test@example.com");

      // Automatic rollback when function exits
    });
  });

  it("should update user", async () => {
    await withTestTransaction(async (tx) => {
      // Each test gets its own transaction
      const [user] = await tx.insert(users).values({...}).returning();
      const [updated] = await tx
        .update(users)
        .set({ displayName: "Updated" })
        .where(eq(users.id, user.id))
        .returning();

      expect(updated.displayName).toBe("Updated");
    });
  });
});
```

**Benefits:**

- True transaction rollback
- No manual cleanup needed
- Each test is completely isolated
- Works with Drizzle's transaction API

**Limitations:**

- Cannot share setup between tests
- Must pass `tx` to all database operations
- Services using global `db` won't participate in transaction

## Best Practices

### 1. Use Consistent Test Data Naming

Prefix all test data with `test-` to allow cleanup:

```typescript
const user = await db.insert(users).values({
  privyUserId: `test-${Date.now()}-${Math.random().toString(36)}`,
  email: `test-${Date.now()}@test.com`,
});
```

### 2. Use Test Helpers

The test helpers (`createTestUser`, `createTestProject`, etc.) automatically follow naming conventions:

```typescript
import { createTestUser, createTestProject } from "../../../helpers/db";

it("should work", async () => {
  const { user } = await createTestUser();
  const project = await createTestProject(user.id);

  expect(project.ownerId).toBe(user.id);
});
```

### 3. Choose the Right Pattern

**Use `setupTestTransaction()`/`testCtx.rollback()` when:**

- You need shared setup across multiple tests
- Tests are complex and need beforeEach/afterEach
- You're working with services that use the global `db` instance

**Use `withTestTransaction()` when:**

- Test is self-contained
- You can pass `tx` to all database operations
- You want maximum isolation

### 4. Handle Foreign Key Constraints

When using manual cleanup, delete in the correct order:

```typescript
afterEach(async () => {
  // Delete children first, then parents
  await db.delete(assets).execute();
  await db.delete(projects).execute();
  await db
    .delete(users)
    .where(sql`privy_user_id LIKE 'test-%'`)
    .execute();
});
```

## Migration Strategy

### From Manual Cleanup to Transaction Isolation

**Before:**

```typescript
describe("ProjectService", () => {
  let userId: string;
  let projectId: string;

  afterEach(async () => {
    if (projectId) {
      await db.delete(projects).where(eq(projects.id, projectId));
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("should create project", async () => {
    const [user] = await db.insert(users).values({...}).returning();
    userId = user.id;

    const [project] = await db.insert(projects).values({...}).returning();
    projectId = project.id;

    expect(project).toBeDefined();
  });
});
```

**After (with setupTestTransaction):**

```typescript
describe("ProjectService", () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    testCtx = await setupTestTransaction();
  });

  afterEach(async () => {
    await testCtx.rollback();
  });

  it("should create project", async () => {
    const [user] = await testCtx.db.insert(users).values({...}).returning();
    const [project] = await testCtx.db.insert(projects).values({...}).returning();

    expect(project).toBeDefined();
    // No manual cleanup needed!
  });
});
```

**After (with withTestTransaction):**

```typescript
describe("ProjectService", () => {
  it("should create project", async () => {
    await withTestTransaction(async (tx) => {
      const [user] = await tx.insert(users).values({...}).returning();
      const [project] = await tx.insert(projects).values({...}).returning();

      expect(project).toBeDefined();
      // Automatic rollback!
    });
  });
});
```

## Troubleshooting

### "UNSAFE_TRANSACTION" Error

If you see `UNSAFE_TRANSACTION: Only use sql.begin, sql.reserved or max: 1`, it means you're trying to use raw `BEGIN`/`ROLLBACK` on a pooled connection.

**Solution:** Use `db.transaction()` or `withTestTransaction()` instead.

### Tests Interfering with Each Other

If tests are seeing data from other tests:

1. Ensure `afterEach` calls `testCtx.rollback()`
2. Use unique IDs for test data (`test-${Date.now()}-${Math.random()}`)
3. Check that all test data uses `test-` prefix for cleanup

### Cleanup Not Working

If test data persists after tests:

1. Check that cleanup query matches test data pattern
2. Verify foreign key constraints aren't preventing deletion
3. Consider using `withTestTransaction()` for guaranteed rollback

## Future Improvements

To achieve true transaction isolation without limitations:

1. **Configure dedicated test database connection** with `max: 1` in connection pool
2. **Use transaction-aware service injection** - pass `tx` to services
3. **Implement savepoint-based nested transactions** for complex test scenarios

## Resources

- [Drizzle ORM Transactions](https://orm.drizzle.team/docs/transactions)
- [postgres.js Transaction Docs](https://github.com/porsager/postgres#transactions)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
