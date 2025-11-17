import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

import { NAVIGATION_VIEWS } from "../constants";
import { NavigationView, NavigationContextValue } from "../types";

const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentView, setCurrentView] = useState<NavigationView>(
    NAVIGATION_VIEWS.DASHBOARD,
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<
    string | null
  >(null);
  const [navigationHistory, setNavigationHistory] = useState<NavigationView[]>(
    [],
  );
  const [importedPlaytestContent, setImportedPlaytestContent] = useState<{
    content: unknown;
    contentType: "quest" | "dialogue" | "npc" | "combat" | "puzzle";
  } | null>(null);

  const navigateTo = useCallback(
    (view: NavigationView) => {
      if (view !== currentView) {
        setNavigationHistory((prev) => [...prev, currentView]);
        setCurrentView(view);

        // STATE PRESERVATION: Don't clear context when navigating
        // selectedAssetId and importedPlaytestContent now persist across views
        // This allows users to return to their previous context
      }
    },
    [currentView],
  );

  const navigateToAsset = useCallback(
    (assetId: string) => {
      setSelectedAssetId(assetId);
      navigateTo(NAVIGATION_VIEWS.ASSETS);
    },
    [navigateTo],
  );

  const navigateToUserProfile = useCallback(
    (userId: string) => {
      setSelectedProfileUserId(userId);
      navigateTo(NAVIGATION_VIEWS.PUBLIC_PROFILE);
    },
    [navigateTo],
  );

  const navigateToPlaytester = useCallback(
    (
      content: unknown,
      contentType: "quest" | "dialogue" | "npc" | "combat" | "puzzle",
    ) => {
      setImportedPlaytestContent({ content, contentType });
      setNavigationHistory((prev) => [...prev, currentView]);
      setCurrentView(NAVIGATION_VIEWS.PLAYTESTER);
    },
    [currentView],
  );

  const goBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const newHistory = [...navigationHistory];
      const previousView = newHistory.pop()!;
      setNavigationHistory(newHistory);
      setCurrentView(previousView);
      // STATE PRESERVATION: Keep imported content when going back
    }
  }, [navigationHistory]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      // State
      currentView,
      selectedAssetId,
      selectedProfileUserId,
      navigationHistory,
      importedPlaytestContent,

      // Actions
      navigateTo,
      navigateToAsset,
      navigateToUserProfile,
      navigateToPlaytester,
      goBack,

      // Helpers
      canGoBack: navigationHistory.length > 0,
    }),
    [
      currentView,
      selectedAssetId,
      selectedProfileUserId,
      navigationHistory,
      importedPlaytestContent,
      navigateTo,
      navigateToAsset,
      navigateToUserProfile,
      navigateToPlaytester,
      goBack,
    ],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
