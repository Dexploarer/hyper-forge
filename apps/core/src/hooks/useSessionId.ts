import { useMemo } from "react";

const SESSION_STORAGE_KEY = "asset_forge_session";

/**
 * Hook to get or create a persistent session ID
 * Session ID is stored in localStorage and persists across page reloads
 */
export const useSessionId = (): string => {
  return useMemo(() => {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  }, []);
};
