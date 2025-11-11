import { lazy, Suspense } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PageSkeleton, KeyboardShortcutsModal } from "./components/common";
import NotificationBar from "./components/shared/NotificationBar";
import { MainLayout } from "./components/layout";
import { NAVIGATION_VIEWS } from "./constants";
import {
  AppProvider,
  AuthProvider,
  useAuth,
  NavigationProvider,
  CommandPaletteProvider,
} from "./contexts";
import { useNavigation } from "./hooks/useNavigation";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { LandingPage } from "./pages/LandingPage";

// Lazy load routes for code splitting
const UnifiedEquipmentPage = lazy(() => import("./pages/UnifiedEquipmentPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const ChatGenerationPage = lazy(() => import("./pages/ChatGenerationPage"));
const ContentLibraryPage = lazy(() => import("./pages/ContentLibraryPage"));
const HandRiggingPage = lazy(() =>
  import("./pages/HandRiggingPage").then((module) => ({
    default: module.HandRiggingPage,
  })),
);
const PlaytesterSwarmPage = lazy(() =>
  import("./pages/PlaytesterSwarmPage").then((module) => ({
    default: module.PlaytesterSwarmPage,
  })),
);
const RetargetAnimatePage = lazy(() =>
  import("./pages/RetargetAnimatePage").then((module) => ({
    default: module.RetargetAnimatePage,
  })),
);
const WorldConfigPage = lazy(() =>
  import("./pages/WorldConfigPage").then((module) => ({
    default: module.WorldConfigPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("./pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { currentView, navigateTo, navigateToAsset } = useNavigation();

  // Initialize global keyboard shortcuts
  const { shortcutsModalOpen, setShortcutsModalOpen, shortcuts } =
    useGlobalShortcuts();

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show main app with Canva-style layout
  return (
    <>
      <NotificationBar />
      <MainLayout currentView={currentView} onViewChange={navigateTo}>
        <Suspense fallback={<PageSkeleton />}>
          {currentView === NAVIGATION_VIEWS.ASSETS && <AssetsPage />}
          {currentView === NAVIGATION_VIEWS.GENERATION && (
            <ChatGenerationPage
              onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
              onNavigateToAsset={navigateToAsset}
            />
          )}
          {currentView === NAVIGATION_VIEWS.CONTENT_LIBRARY && (
            <ContentLibraryPage />
          )}
          {currentView === NAVIGATION_VIEWS.PLAYTESTER && (
            <PlaytesterSwarmPage />
          )}
          {currentView === NAVIGATION_VIEWS.EQUIPMENT && (
            <UnifiedEquipmentPage />
          )}
          {currentView === NAVIGATION_VIEWS.HAND_RIGGING && <HandRiggingPage />}
          {/* ARMOR_FITTING route kept for backward compatibility - redirects to unified equipment page */}
          {currentView === NAVIGATION_VIEWS.ARMOR_FITTING && (
            <UnifiedEquipmentPage />
          )}
          {currentView === NAVIGATION_VIEWS.RETARGET_ANIMATE && (
            <RetargetAnimatePage />
          )}
          {currentView === NAVIGATION_VIEWS.WORLD_CONFIG && <WorldConfigPage />}
          {currentView === NAVIGATION_VIEWS.SETTINGS && <SettingsPage />}
          {currentView === NAVIGATION_VIEWS.ADMIN_DASHBOARD && (
            <AdminDashboardPage />
          )}
        </Suspense>
      </MainLayout>

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        shortcuts={shortcuts}
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </>
  );
}

function App() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <AppProvider>
        <AuthProvider>
          <NavigationProvider>
            <CommandPaletteProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </CommandPaletteProvider>
          </NavigationProvider>
        </AuthProvider>
      </AppProvider>
    </PrivyProvider>
  );
}

export default App;
