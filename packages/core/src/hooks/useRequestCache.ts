/**
 * Request Cache Hook
 * Prevents duplicate API calls by caching in-flight requests
 */

import { useCallback, useRef } from 'react'

const requestCache = new Map<string, Promise<any>>()

export function useRequestCache() {
  const cacheRef = useRef(requestCache)

  const cachedRequest = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cacheKey = key
    
    // Check if request is already in flight
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!
    }
    
    // Create new request
    const promise = fetcher()
      .then((result) => {
        // Cache result if TTL provided
        if (ttl) {
          setTimeout(() => {
            cacheRef.current.delete(cacheKey)
          }, ttl)
        } else {
          // Remove immediately after completion
          cacheRef.current.delete(cacheKey)
        }
        return result
      })
      .catch((error) => {
        // Remove on error
        cacheRef.current.delete(cacheKey)
        throw error
      })
    
    cacheRef.current.set(cacheKey, promise)
    return promise
  }, [])

  const clearCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key)
    } else {
      cacheRef.current.clear()
    }
  }, [])

  return { cachedRequest, clearCache }
}

