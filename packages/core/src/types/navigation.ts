export type NavigationView = 'assets' | 'generation' | 'audio' | 'content' | 'contentLibrary' | 'playtester' | 'equipment' | 'handRigging' | 'armorFitting' | 'retargetAnimate' | 'adminDashboard' | 'settings'

export interface NavigationState {
  currentView: NavigationView
  selectedAssetId: string | null
  navigationHistory: NavigationView[]
  // Content to import to playtester
  importedPlaytestContent: {
    content: unknown
    contentType: 'quest' | 'dialogue' | 'npc' | 'combat' | 'puzzle'
  } | null
}

export interface NavigationContextValue extends NavigationState {
  // Navigation actions
  navigateTo: (view: NavigationView) => void
  navigateToAsset: (assetId: string) => void
  navigateToPlaytester: (content: unknown, contentType: 'quest' | 'dialogue' | 'npc' | 'combat' | 'puzzle') => void
  goBack: () => void
  
  // Navigation helpers
  canGoBack: boolean
} 