/**
 * React Query Test Helpers
 *
 * Utilities for testing React Query hooks with Bun test
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AppProvider } from "@/contexts/AppContext";

/**
 * Create a test query client with optimal settings for testing
 * - Disables retries for faster test execution
 * - Sets infinite garbage collection time to prevent cache cleanup during tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: Infinity, // Prevent garbage collection during tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Create a wrapper component with QueryClientProvider
 *
 * Usage:
 * ```typescript
 * const queryClient = createTestQueryClient();
 * const { result } = renderHook(() => useAssets(), {
 *   wrapper: createWrapper(queryClient),
 * });
 * ```
 */
export function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Create a wrapper with additional providers (Auth, App, etc.)
 *
 * Usage:
 * ```typescript
 * const queryClient = createTestQueryClient();
 * const wrapper = createWrapperWithProviders(queryClient, [
 *   MockAuthProvider,
 *   MockAppProvider,
 * ]);
 *
 * const { result } = renderHook(() => useAssets(), { wrapper });
 * ```
 */
export function createWrapperWithProviders(
  queryClient: QueryClient,
  additionalProviders: React.FC<{ children: React.ReactNode }>[] = []
) {
  return ({ children }: { children: React.ReactNode }) => {
    let wrapped = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    // Wrap with additional providers (Auth, App, etc.)
    for (const Provider of additionalProviders.reverse()) {
      wrapped = <Provider>{wrapped}</Provider>;
    }

    return wrapped;
  };
}

/**
 * Mock AppContext Provider for testing
 */
export const MockAppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

/**
 * Create wrapper with AppContext for hooks that use useApp()
 *
 * This wraps components with both QueryClientProvider and AppProvider,
 * allowing tests to work with hooks that use useContent, useProjects, etc.
 *
 * Usage:
 * ```typescript
 * const queryClient = createTestQueryClient();
 * const wrapper = createWrapperWithAppContext(queryClient);
 * const { result } = renderHook(() => useContent(), { wrapper });
 * ```
 */
export function createWrapperWithAppContext(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
}
