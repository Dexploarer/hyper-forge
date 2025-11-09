export type NavigationView = 'assets' | 'generation' | 'audio' | 'content' | 'contentLibrary' | 'playtester' | 'equipment' | 'handRigging' | 'armorFitting' | 'retargetAnimate'

export interface NavigationState {
  currentView: NavigationView
  selectedAssetId: string | null
  navigationHistory: NavigationView[]
}

export interface NavigationContextValue extends NavigationState {
  // Navigation actions
  navigateTo: (view: NavigationView) => void
  navigateToAsset: (assetId: string) => void
  goBack: () => void
  
  // Navigation helpers
  canGoBack: boolean
} 