/**
 * Optimistic Update Utilities
 * Provides helpers for implementing optimistic UI updates
 * Based on TanStack Query patterns but framework-agnostic
 */

export interface OptimisticUpdateConfig<TData, TVariables> {
  /**
   * Function to generate optimistic data from variables
   */
  optimisticData: (variables: TVariables) => TData
  
  /**
   * Function to update the cache/data store optimistically
   */
  updateCache: (data: TData) => void
  
  /**
   * Function to rollback the optimistic update
   */
  rollback: () => void
  
  /**
   * Optional: Function to merge server response with optimistic data
   */
  mergeResponse?: (optimistic: TData, response: TData) => TData
}

export interface OptimisticUpdateResult<TData> {
  /**
   * Snapshot of previous state for rollback
   */
  snapshot: TData
  
  /**
   * Optimistic data that was applied
   */
  optimistic: TData
  
  /**
   * Function to rollback the optimistic update
   */
  rollback: () => void
  
  /**
   * Function to commit the update (replace optimistic with real data)
   */
  commit: (realData: TData) => void
}

/**
 * Create an optimistic update handler
 */
export function createOptimisticUpdate<TData, TVariables>(
  config: OptimisticUpdateConfig<TData, TVariables>
) {
  return (variables: TVariables): OptimisticUpdateResult<TData> => {
    // Generate optimistic data
    const optimisticData = config.optimisticData(variables)
    
    // Apply optimistic update
    config.updateCache(optimisticData)
    
    // Return rollback function
    return {
      snapshot: optimisticData, // In real implementation, this would be the previous state
      optimistic: optimisticData,
      rollback: config.rollback,
      commit: (realData: TData) => {
        const finalData = config.mergeResponse
          ? config.mergeResponse(optimisticData, realData)
          : realData
        config.updateCache(finalData)
      },
    }
  }
}

/**
 * Helper for list operations (add, remove, update)
 */
export interface ListOptimisticConfig<TItem, TVariables> {
  getList: () => TItem[]
  setList: (items: TItem[]) => void
  getItemId: (item: TItem) => string | number
}

export function createListOptimisticUpdate<TItem, TVariables>(
  config: ListOptimisticConfig<TItem, TVariables>
) {
  return {
    /**
     * Optimistically add an item to a list
     */
    add: (createItem: (vars: TVariables) => TItem) => {
      return (variables: TVariables) => {
        const currentList = config.getList()
        const newItem = createItem(variables)
        const optimisticList = [...currentList, newItem]
        config.setList(optimisticList)
        
        return {
          snapshot: currentList,
          optimistic: optimisticList,
          rollback: () => config.setList(currentList),
          commit: (realItem: TItem) => {
            // Replace optimistic item with real item
            const updatedList = optimisticList.map(item =>
              config.getItemId(item) === config.getItemId(newItem) ? realItem : item
            )
            config.setList(updatedList)
          },
        }
      }
    },
    
    /**
     * Optimistically remove an item from a list
     */
    remove: (getItemId: (vars: TVariables) => string | number) => {
      return (variables: TVariables) => {
        const currentList = config.getList()
        const itemId = getItemId(variables)
        const filteredList = currentList.filter(
          item => config.getItemId(item) !== itemId
        )
        config.setList(filteredList)
        
        return {
          snapshot: currentList,
          optimistic: filteredList,
          rollback: () => config.setList(currentList),
          commit: () => {
            // Already removed, no-op
          },
        }
      }
    },
    
    /**
     * Optimistically update an item in a list
     */
    update: (
      getItemId: (vars: TVariables) => string | number,
      updateItem: (item: TItem, vars: TVariables) => TItem
    ) => {
      return (variables: TVariables) => {
        const currentList = config.getList()
        const itemId = getItemId(variables)
        const updatedList = currentList.map(item =>
          config.getItemId(item) === itemId ? updateItem(item, variables) : item
        )
        config.setList(updatedList)
        
        return {
          snapshot: currentList,
          optimistic: updatedList,
          rollback: () => config.setList(currentList),
          commit: (realItem: TItem) => {
            const finalList = updatedList.map(item =>
              config.getItemId(item) === itemId ? realItem : item
            )
            config.setList(finalList)
          },
        }
      }
    },
  }
}

