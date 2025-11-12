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
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UnifiedEquipmentPage = lazy(() => import("./pages/UnifiedEquipmentPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
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

// 3D Generation pages
const CharacterGenerationPage = lazy(
  () => import("./pages/generation/CharacterGenerationPage"),
);
const PropGenerationPage = lazy(
  () => import("./pages/generation/PropGenerationPage"),
);
const EnvironmentGenerationPage = lazy(
  () => import("./pages/generation/EnvironmentGenerationPage"),
);
const WorldBuilderPage = lazy(
  () => import("./pages/generation/WorldBuilderPage"),
);

// Content Generation pages
const NPCGenerationPage = lazy(
  () => import("./pages/generation/NPCGenerationPage"),
);
const QuestGenerationPage = lazy(
  () => import("./pages/generation/QuestGenerationPage"),
);
const DialogueGenerationPage = lazy(
  () => import("./pages/generation/DialogueGenerationPage"),
);
const LoreGenerationPage = lazy(
  () => import("./pages/generation/LoreGenerationPage"),
);

// Audio Generation pages
const VoiceGenerationPage = lazy(
  () => import("./pages/generation/VoiceGenerationPage"),
);
const SFXGenerationPage = lazy(
  () => import("./pages/generation/SFXGenerationPage"),
);
const MusicGenerationPage = lazy(
  () => import("./pages/generation/MusicGenerationPage"),
);

// Public Profile page
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));

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
          {/* Core pages */}
          {currentView === NAVIGATION_VIEWS.DASHBOARD && <DashboardPage />}
          {currentView === NAVIGATION_VIEWS.ASSETS && <AssetsPage />}
          {currentView === NAVIGATION_VIEWS.PROJECTS && <ProjectsPage />}
          {currentView === NAVIGATION_VIEWS.CONTENT_LIBRARY && (
            <ContentLibraryPage />
          )}

          {/* 3D Generation pages */}
          {currentView === NAVIGATION_VIEWS.GENERATION_CHARACTER && (
            <CharacterGenerationPage
              onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
              onNavigateToAsset={navigateToAsset}
            />
          )}
          {currentView === NAVIGATION_VIEWS.GENERATION_PROP && (
            <PropGenerationPage
              onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
              onNavigateToAsset={navigateToAsset}
            />
          )}
          {currentView === NAVIGATION_VIEWS.GENERATION_ENVIRONMENT && (
            <EnvironmentGenerationPage
              onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
              onNavigateToAsset={navigateToAsset}
            />
          )}
          {currentView === NAVIGATION_VIEWS.GENERATION_WORLD && (
            <WorldBuilderPage
              onNavigateToAssets={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
              onNavigateToAsset={navigateToAsset}
            />
          )}

          {/* Content Generation pages */}
          {currentView === NAVIGATION_VIEWS.CONTENT_NPC && (
            <NPCGenerationPage />
          )}
          {currentView === NAVIGATION_VIEWS.CONTENT_QUEST && (
            <QuestGenerationPage />
          )}
          {currentView === NAVIGATION_VIEWS.CONTENT_DIALOGUE && (
            <DialogueGenerationPage />
          )}
          {currentView === NAVIGATION_VIEWS.CONTENT_LORE && (
            <LoreGenerationPage />
          )}

          {/* Audio Generation pages */}
          {currentView === NAVIGATION_VIEWS.AUDIO_VOICE && (
            <VoiceGenerationPage />
          )}
          {currentView === NAVIGATION_VIEWS.AUDIO_SFX && <SFXGenerationPage />}
          {currentView === NAVIGATION_VIEWS.AUDIO_MUSIC && (
            <MusicGenerationPage />
          )}

          {/* Tools */}
          {currentView === NAVIGATION_VIEWS.PLAYTESTER && (
            <PlaytesterSwarmPage />
          )}
          {currentView === NAVIGATION_VIEWS.EQUIPMENT && (
            <UnifiedEquipmentPage />
          )}
          {currentView === NAVIGATION_VIEWS.HAND_RIGGING && <HandRiggingPage />}
          {currentView === NAVIGATION_VIEWS.RETARGET_ANIMATE && (
            <RetargetAnimatePage />
          )}
          {currentView === NAVIGATION_VIEWS.WORLD_CONFIG && <WorldConfigPage />}

          {/* System */}
          {currentView === NAVIGATION_VIEWS.SETTINGS && <SettingsPage />}
          {currentView === NAVIGATION_VIEWS.ADMIN_DASHBOARD && (
            <AdminDashboardPage />
          )}

          {/* Public Profile */}
          {currentView === NAVIGATION_VIEWS.PUBLIC_PROFILE && (
            <PublicProfilePage />
          )}

          {/* Legacy/backward compatibility routes */}
          {currentView === NAVIGATION_VIEWS.ARMOR_FITTING && (
            <UnifiedEquipmentPage />
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
        // Note: Solana external wallet warning is safe to ignore
        // Only affects external wallets like Phantom, not embedded wallets
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
