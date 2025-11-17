/**
 * Privy Auth Mock Fixtures
 * Smart mocks for Privy authentication to avoid external dependencies
 */

export const mockPrivyUser = {
  id: "mock-privy-user-123",
  created_at: Date.now(),
  linked_accounts: [
    {
      type: "wallet",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chain_type: "ethereum",
      chain_id: "eip155:1",
      wallet_client: "metamask",
      wallet_client_type: "metamask",
      connector_type: "injected",
      verified_at: Date.now(),
    },
  ],
  has_accepted_terms: true,
  is_guest: false,
};

export const mockPrivyToken =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXByaXZ5LXVzZXItMTIzIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.mock-signature";

export const mockPrivyAuthResponse = {
  token: mockPrivyToken,
  user: mockPrivyUser,
  is_new_user: false,
};

export const mockPrivyVerifyResponse = {
  userId: "mock-privy-user-123",
  appId: "mock-app-id",
  sessionId: "mock-session-123",
  isValid: true,
};

/**
 * Create mock Privy verification function
 */
export function createMockPrivyVerifier() {
  return async (token: string) => {
    if (token === mockPrivyToken || token.startsWith("mock-")) {
      return mockPrivyVerifyResponse;
    }
    throw new Error("Invalid token");
  };
}

/**
 * Mock Privy auth headers
 */
export function getMockPrivyHeaders() {
  return {
    Authorization: `Bearer ${mockPrivyToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create mock authenticated request
 */
export function createMockAuthRequest(url: string, options?: RequestInit) {
  return new Request(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...getMockPrivyHeaders(),
    },
  });
}
