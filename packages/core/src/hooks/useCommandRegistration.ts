import { useEffect } from 'react'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
import type { CommandPaletteItem } from '@/components/common'

/**
 * Hook for pages/components to register commands with the command palette
 * Commands are automatically removed when the component unmounts
 */
export const useCommandRegistration = (commands: CommandPaletteItem[]) => {
  const { addCommands, removeCommands } = useCommandPalette()

  useEffect(() => {
    // Register commands on mount
    addCommands(commands)

    // Cleanup: remove commands on unmount
    return () => {
      const commandIds = commands.map(c => c.id)
      removeCommands(commandIds)
    }
  }, [commands, addCommands, removeCommands])
}

