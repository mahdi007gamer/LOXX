/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ScreenSplash } from "./components/layout/ScreenSplash";
import { Navbar } from "./components/layout/Navbar";
import { BottomNav } from "./components/layout/BottomNav";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { LobbyProvider } from "./context/LobbyContext";
import { FriendsProvider } from "./context/FriendsContext";
import { GamesProvider } from "./context/GamesContext";
import { ProfilePopoverProvider } from "./context/ProfilePopoverContext";
import { LobbyOverlay } from "./components/LobbyOverlay";
import { FriendChatOverlay } from "./components/ui/FriendChatOverlay";
import { DiscordOverlayHUD } from "./components/DiscordOverlayHUD";
import ScrollToTop from "./components/ScrollToTop";
import { DashboardPage } from "./pages/DashboardPage";
import { ChatPage } from "./pages/ChatPage";
import { LobbiesPage } from "./pages/LobbiesPage";
import { LobbyRoomPage } from "./pages/LobbyRoomPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RoomsPage } from "./pages/RoomsPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PremiumPage } from "./pages/PremiumPage";
import { SettingsPage } from "./pages/SettingsPage";
import { FriendsPage } from "./pages/FriendsPage";
import { InviteRedirectPage } from "./pages/InviteRedirectPage";
import { BaleCallbackPage } from "./pages/BaleCallbackPage";
import { GamesPage } from "./pages/GamesPage";
import { MyGamesPage } from "./pages/MyGamesPage";
import { EliteSettingsPage } from "./pages/EliteSettingsPage";
import { NotificationHandler } from "./components/NotificationHandler";
import { DesktopOverlayWidget } from "./pages/DesktopOverlayWidget";
import { ElectronTitlebar } from "./components/layout/ElectronTitlebar";
import { cn } from "./lib/utils";
import NotFoundPage from "./pages/NotFoundPage";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster, toast } from "react-hot-toast";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPage } from "./pages/AdminPage";

import { PublicProfilePage } from "./pages/PublicProfilePage";
import { ElectronSettingsPage } from "./pages/ElectronSettingsPage";

const AppContent = () => {
  const { isSidebarCollapsed } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isOverlayWidget = location.pathname === "/lobby/overlay-widget";
  const hideSidebar = isLanding || location.pathname === "/auth" || isOverlayWidget;
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    if (!isElectron) return false;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("loxx_splash_shown")) {
      return false;
    }
    return true;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("loxx_splash_shown", "true");
    }
  };

  useEffect(() => {
    if (!showSplash) {
      const handleAppUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        const updateFn = customEvent.detail?.update;
        if (updateFn) {
          toast.success(
            <div className="flex flex-col gap-2 w-full text-right" dir="rtl">
              <span className="font-bold text-sm text-[#00e5ff]">نسخه جدید لوکس در دسترس است!</span>
              <span className="text-xs text-gray-300">برای اعمال تغییرات و دریافت آخرین امکانات دکمه زیر را کلیک کنید.</span>
              <button 
                onClick={() => updateFn()} 
                className="mt-1 bg-[#00e5ff] text-[#0a0a0f] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white transition-colors self-start shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              >
                بروزرسانی تغییرات
              </button>
            </div>,
            { duration: 60000, position: 'bottom-center' }
          );
        }
      };
      window.addEventListener('app-update-available', handleAppUpdate);
      return () => window.removeEventListener('app-update-available', handleAppUpdate);
    }
  }, [showSplash]);

  useEffect(() => {
    if (!isElectron) return;
    const api = (window as any).electronAPI;
    if (api && api.onMaximizeStatusChange) {
      const unsubscribe = api.onMaximizeStatusChange((status: boolean) => {
        setIsMaximized(status);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isElectron]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="fixed inset-0 z-[999999]"
          >
            <ScreenSplash onComplete={handleSplashComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "min-h-screen selection:bg-neon-pink selection:text-white pb-16 md:pb-0 relative",
        isOverlayWidget ? "bg-transparent pb-0" : "bg-dark-bg text-gray-100"
      )}>
      {isElectron && !isOverlayWidget && !isMaximized && (
        <div className="fixed inset-0 border border-white/10 pointer-events-none z-[100000] rounded-none shadow-[inset_0_0_15px_rgba(255,0,127,0.02)]" />
      )}
      <NotificationHandler />
      {!isOverlayWidget && <ElectronTitlebar />}
      
      {/* Abstract background effects */}
      {!isOverlayWidget && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-pink/5 rounded-full blur-[120px]" />
          <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-neon-purple/5 rounded-full blur-[120px]" />
          
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        </div>
      )}

      {!isOverlayWidget && <Navbar />}
      
      <main className={cn("relative", !isLanding && !isOverlayWidget && (isElectron ? "pt-[100px]" : "pt-16"))}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/bale/callback" element={<BaleCallbackPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/lobbies" element={<ProtectedRoute><LobbiesPage /></ProtectedRoute>} />
          <Route path="/lobby/:id" element={<ProtectedRoute><LobbyRoomPage /></ProtectedRoute>} />
          <Route path="/lobby/overlay-widget" element={<DesktopOverlayWidget />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/electron-settings" element={<ProtectedRoute><ElectronSettingsPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/invite/:code" element={<InviteRedirectPage />} />
          <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
          <Route path="/my-games" element={<ProtectedRoute><MyGamesPage /></ProtectedRoute>} />
          <Route path="/settings/elite" element={<ProtectedRoute><EliteSettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isLanding && !isOverlayWidget && <BottomNav />}
      
      {/* We only render LobbyOverlay in main window, not overlay widget */}
      {!isOverlayWidget && <LobbyOverlay />}
      
      {/* FriendChatOverlay logic:
          - Rendered everywhere so DM chat works in main window too, handles overlay state internally
      */}
      <FriendChatOverlay />
      
      <Toaster 
        position="bottom-right" 
        gutter={12}
        containerStyle={{
          bottom: isOverlayWidget ? 40 : 80,
          right: isOverlayWidget ? 40 : 24,
          left: "auto",
          zIndex: 999999999,
        }}
        containerClassName="pointer-events-none"
        toastOptions={{
          className: 'modern-glass-toast pointer-events-auto',
          style: {
            background: 'rgba(13, 13, 20, 0.4)',
            backdropFilter: 'blur(16px) saturate(200%)',
            WebkitBackdropFilter: 'blur(16px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            borderRadius: '20px',
            padding: '16px 20px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
            maxWidth: '400px',
            minWidth: '280px',
            width: 'max-content',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            direction: 'rtl',
          },
          iconTheme: {
            primary: '#00e5ff',
            secondary: '#0a0a0f',
          },
        }}
      />
    </div>
    </>
  );
};

function App() {
  const isOverlayWidget = typeof window !== 'undefined' && window.location.pathname === '/lobby/overlay-widget';
  
  return (
    <AuthProvider>
      <GamesProvider>
        <FriendsProvider>
          <LobbyProvider>
            <ProfilePopoverProvider>
              <Router>
                <ScrollToTop />
                <AppContent />
                <DiscordOverlayHUD />
              </Router>
            </ProfilePopoverProvider>
          </LobbyProvider>
        </FriendsProvider>
      </GamesProvider>
    </AuthProvider>
  );
}

export default App;
