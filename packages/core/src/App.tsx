import { PrivyProvider } from '@privy-io/react-auth';
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import NotificationBar from "./components/shared/NotificationBar";
import { MainLayout } from "./components/layout";
import { NAVIGATION_VIEWS } from "./constants";
import { AppProvider } from "./contexts/AppContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CommandPaletteProvider } from "./contexts/CommandPaletteContext";
import { useNavigation } from "./hooks/useNavigation";
import { LandingPage } from "./pages/LandingPage";
import { UnifiedEquipmentPage } from "./pages/UnifiedEquipmentPage";
import { AssetsPage } from "./pages/AssetsPage";
import { ChatGenerationPage } from "./pages/ChatGenerationPage";
import { ContentLibraryPage } from "./pages/ContentLibraryPage";
import { HandRiggingPage } from "./pages/HandRiggingPage";
import { PlaytesterSwarmPage } from "./pages/PlaytesterSwarmPage";
import { RetargetAnimatePage } from "./pages/RetargetAnimatePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { currentView, navigateTo, navigateToAsset } = useNavigation();

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show main app with Canva-style layout
  return (
    <>
      <NotificationBar />
      <MainLayout currentView={currentView} onViewChange={navigateTo}>
        {currentView === NAVIGATION_VIEWS.ASSETS && <AssetsPage />}
        {currentView === NAVIGATION_VIEWS.GENERATION && (
          <ChatGenerationPage
            onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
            onNavigateToAsset={navigateToAsset}
          />
        )}
        {currentView === NAVIGATION_VIEWS.CONTENT_LIBRARY && <ContentLibraryPage />}
        {currentView === NAVIGATION_VIEWS.PLAYTESTER && <PlaytesterSwarmPage />}
        {currentView === NAVIGATION_VIEWS.EQUIPMENT && <UnifiedEquipmentPage />}
        {currentView === NAVIGATION_VIEWS.HAND_RIGGING && <HandRiggingPage />}
        {/* ARMOR_FITTING route kept for backward compatibility - redirects to unified equipment page */}
        {currentView === NAVIGATION_VIEWS.ARMOR_FITTING && <UnifiedEquipmentPage />}
        {currentView === NAVIGATION_VIEWS.RETARGET_ANIMATE && <RetargetAnimatePage />}
        {currentView === NAVIGATION_VIEWS.SETTINGS && <SettingsPage />}
        {currentView === NAVIGATION_VIEWS.ADMIN_DASHBOARD && <AdminDashboardPage />}
      </MainLayout>
    </>
  );
}

function App() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
          solana: {
            createOnLogin: 'users-without-wallets',
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
