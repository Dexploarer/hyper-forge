/**
 * View Transitions API Utilities
 * Provides smooth page transitions (Chrome 111+)
 */

import { useCallback } from 'react'

export function startViewTransition(callback: () => void): void {
  if ('startViewTransition' in document) {
    ;(document as any).startViewTransition(callback)
  } else {
    // Fallback for browsers without support
    callback()
  }
}

export function useViewTransition() {
  const navigate = useCallback((callback: () => void) => {
    startViewTransition(callback)
  }, [])

  return { navigate }
}

