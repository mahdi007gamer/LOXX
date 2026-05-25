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
import { LobbyProvider, useLobby } from "./context/LobbyContext";
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
import { Toaster, toast, ToastBar, resolveValue } from "react-hot-toast";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPage } from "./pages/AdminPage";

import { PublicProfilePage } from "./pages/PublicProfilePage";
import { ElectronSettingsPage } from "./pages/ElectronSettingsPage";

const AppContent = () => {
  const { isSidebarCollapsed } = useAuth();
  const { overlayToastPosition, overlayToastXOffset, overlayToastYOffset } = useLobby();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isOverlayWidget = location.pathname === "/lobby/overlay-widget";
  const hideSidebar = isLanding || location.pathname === "/auth" || isOverlayWidget;
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : false);
  const [showSplash, setShowSplash] = useState(() => {
    if (!isElectron) return false;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("loxx_splash_shown")) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(typeof window !== "undefined" ? window.innerWidth >= 768 : false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getToasterRight = () => {
    if (isOverlayWidget) return 40;
    if (hideSidebar || !isDesktop) return 24; // standard margin
    return isSidebarCollapsed ? 96 : 280; // on desktop, clear collapsed/expanded sidebar
  };

  const getDynamicToasterStyle = () => {
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
    const width = typeof window !== "undefined" ? window.innerWidth : 1000;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;

    const limitX = 16; // 16px safety distance from left/right edges
    const limitY = 16;

    const style: any = {
      zIndex: 999999999,
      position: "fixed" as const,
      pointerEvents: "none" as const,
    };

    if (!isOverlayWidget) {
      // Normal application mode
      // User requested it to be placed fully to the right (راست تر), not too far inside the center.
      // So on desktop, we use a constant 24px from the right, identical to mobile / standard margin.
      const targetRight = 24; 

      // Ensure the toast won't clip on the left/right boundaries of the screen
      const toastWidth = isMobile ? 310 : 380;
      const maxAllowedRight = Math.max(limitX, width - toastWidth - limitX);
      const safeRight = Math.min(targetRight, maxAllowedRight);

      style.bottom = isMobile ? 80 : 24; // Safe padding from bottom/Navbar
      style.right = safeRight;
      style.left = "auto";
      style.width = isMobile ? "calc(100vw - 32px)" : `${toastWidth}px`;
      style.maxWidth = isMobile ? "calc(100vw - 32px)" : `${toastWidth}px`;
      style.minWidth = isMobile ? "280px" : `${toastWidth}px`;
      
      return style;
    }

    // Overlay Widget mode - we use dragged offsets but clamp them to the safe screen area!
    const toastWidth = 360; 
    const toastHeight = 160;

    // Strict clamping to guard against clipping and sticking out of the right side (limit at least 15px inside)
    const safeX = Math.max(15, Math.min(width - toastWidth - 15, overlayToastXOffset));
    const safeY = Math.max(15, Math.min(height - toastHeight - 15, overlayToastYOffset));

    if (overlayToastPosition.includes("top")) {
      style.top = safeY;
      style.bottom = "auto";
    } else {
      style.bottom = safeY;
      style.top = "auto";
    }

    if (overlayToastPosition.includes("left")) {
      style.left = safeX;
      style.right = "auto";
    } else {
      style.right = safeX;
      style.left = "auto";
    }

    // Enforce the size directly on the toaster container so that react-hot-toast's inner layout aligns flawlessly
    style.width = `${toastWidth}px`;
    style.maxWidth = `${toastWidth}px`;
    style.minWidth = `${toastWidth}px`;

    return style;
  };

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
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-fade-in' : 'animate-fade-out'} bg-[#0a0a0f]/95 border border-[#00e5ff]/20 p-5 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.15)] flex flex-col gap-3 min-w-[320px] max-w-[400px] pointer-events-auto backdrop-blur-xl transition-all`} dir="rtl">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#00e5ff] animate-ping"></div>
                <span className="font-bold text-[13px] text-[#00e5ff]">کلاینت لوکس در حال بروزرسانی است</span>
              </div>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                در حال دریافت و اعمال تغییرات لوکس... کلاینت به صورت خودکار رفرش خواهد شد.
              </p>
              
              {/* Animated Progress Bar */}
              <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1 border border-white/5">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.5, ease: "easeInOut" }}
                  className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#00e5ff] to-[#0088ff]"
                  onAnimationComplete={() => {
                    setTimeout(() => {
                      updateFn();
                    }, 500);
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold font-mono">
                <span>%100</span>
                <span>%0</span>
              </div>
            </div>
          ), { duration: 15000, position: 'bottom-right' });
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
        position={isOverlayWidget ? overlayToastPosition : "bottom-right"} 
        gutter={12}
        containerStyle={getDynamicToasterStyle()}
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
      >
        {(t) => {
          // If in Electron main window, only allow lobby invitations
          if (isElectron && !isOverlayWidget) {
            const isLobbyInvite = t.id && (t.id.startsWith("invite-") || t.id.toLowerCase().includes("invite"));
            if (!isLobbyInvite) {
              return null; // Suppress notification in standard app window while keeping it in overlay
            }
          }

          return t.type === 'custom' ? (
            resolveValue(t.message, t)
          ) : (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== 'loading' && (
                    <button 
                      onClick={() => toast.dismiss(t.id)} 
                      className="mr-2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          );
        }}
      </Toaster>
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
