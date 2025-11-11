/**
 * Auth Token Store
 * Global store for Privy access token that can be accessed outside React components
 */

let currentToken: string | null = null;
let tokenUpdateCallbacks: Set<(token: string | null) => void> = new Set();

/**
 * Set the current access token
 */
export function setAuthToken(token: string | null): void {
  currentToken = token;
  // Notify all callbacks
  tokenUpdateCallbacks.forEach((callback) => callback(token));
}

/**
 * Get the current access token
 */
export function getAuthToken(): string | null {
  return currentToken;
}

/**
 * Subscribe to token updates
 */
export function onTokenUpdate(callback: (token: string | null) => void): () => void {
  tokenUpdateCallbacks.add(callback);
  // Return unsubscribe function
  return () => {
    tokenUpdateCallbacks.delete(callback);
  };
}

/**
 * Clear the token (on logout)
 */
export function clearAuthToken(): void {
  setAuthToken(null);
}

