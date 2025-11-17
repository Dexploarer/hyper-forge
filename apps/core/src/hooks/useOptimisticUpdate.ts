/**
 * Optimistic Update Hook
 * Updates UI immediately, syncs with server in background
 */

import { useState, useCallback } from 'react'

export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (item: T) => Promise<T>,
  rollbackFn?: (previous: T) => void
) {
  const [data, setData] = useState<T>(initialData)
  const [isPending, setIsPending] = useState(false)
  const [previousData, setPreviousData] = useState<T | null>(null)

  const update = useCallback(async (optimisticData: T) => {
    setIsPending(true)
    setPreviousData(data)
    
    // Update UI immediately
    setData(optimisticData)
    
    try {
      // Sync with server
      const result = await updateFn(optimisticData)
      setData(result)
      return result
    } catch (error) {
      // Rollback on error
      if (previousData !== null) {
        setData(previousData)
        rollbackFn?.(previousData)
      }
      throw error
    } finally {
      setIsPending(false)
      setPreviousData(null)
    }
  }, [data, updateFn, rollbackFn, previousData])

  return { data, update, isPending }
}

