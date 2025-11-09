import { ErrorBoundary } from "./components/common/ErrorBoundary";
import NotificationBar from "./components/shared/NotificationBar";
import { MainLayout } from "./components/layout";
import { NAVIGATION_VIEWS } from "./constants";
import { AppProvider } from "./contexts/AppContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useNavigation } from "./hooks/useNavigation";
import { LandingPage } from "./pages/LandingPage";
import { UnifiedEquipmentPage } from "./pages/UnifiedEquipmentPage";
import { AssetsPage } from "./pages/AssetsPage";
import { AudioGenerationPage } from "./pages/AudioGenerationPage";
import { ContentGenerationPage } from "./pages/ContentGenerationPage";
import { ContentLibraryPage } from "./pages/ContentLibraryPage";
import { GenerationPage } from "./pages/GenerationPage";
import { HandRiggingPage } from "./pages/HandRiggingPage";
import { PlaytesterSwarmPage } from "./pages/PlaytesterSwarmPage";
import { RetargetAnimatePage } from "./pages/RetargetAnimatePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

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
          <GenerationPage
            onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
            onNavigateToAsset={navigateToAsset}
          />
        )}
        {currentView === NAVIGATION_VIEWS.AUDIO && <AudioGenerationPage />}
        {currentView === NAVIGATION_VIEWS.CONTENT && <ContentGenerationPage />}
        {currentView === NAVIGATION_VIEWS.CONTENT_LIBRARY && <ContentLibraryPage />}
        {currentView === NAVIGATION_VIEWS.PLAYTESTER && <PlaytesterSwarmPage />}
        {currentView === NAVIGATION_VIEWS.EQUIPMENT && <UnifiedEquipmentPage />}
        {currentView === NAVIGATION_VIEWS.HAND_RIGGING && <HandRiggingPage />}
        {/* ARMOR_FITTING route kept for backward compatibility - redirects to unified equipment page */}
        {currentView === NAVIGATION_VIEWS.ARMOR_FITTING && <UnifiedEquipmentPage />}
        {currentView === NAVIGATION_VIEWS.RETARGET_ANIMATE && <RetargetAnimatePage />}
        {currentView === NAVIGATION_VIEWS.ADMIN_DASHBOARD && <AdminDashboardPage />}
      </MainLayout>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <NavigationProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </NavigationProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
