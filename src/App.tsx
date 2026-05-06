/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import { GamesPage } from "./pages/GamesPage";
import { MyGamesPage } from "./pages/MyGamesPage";
import { NotificationHandler } from "./components/NotificationHandler";
import { cn } from "./lib/utils";

import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPage } from "./pages/AdminPage";

import { PublicProfilePage } from "./pages/PublicProfilePage";

const AppContent = () => {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 selection:bg-neon-pink selection:text-white pb-20 md:pb-0">
      <NotificationHandler />
      {/* Abstract background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-pink/5 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-neon-purple/5 rounded-full blur-[120px]" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      <Navbar />
      
      <main className={cn("relative", !isLanding && "pt-16")}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/lobbies" element={<ProtectedRoute><LobbiesPage /></ProtectedRoute>} />
          <Route path="/lobby/:id" element={<ProtectedRoute><LobbyRoomPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
          <Route path="/my-games" element={<ProtectedRoute><MyGamesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>} />
        </Routes>
      </main>

      {!isLanding && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <GamesProvider>
        <FriendsProvider>
          <LobbyProvider>
            <ProfilePopoverProvider>
              <Router>
                <ScrollToTop />
                <AppContent />
                <LobbyOverlay />
                <FriendChatOverlay />
                <Toaster 
                  position="top-center" 
                  containerStyle={{
                    zIndex: 99999,
                  }}
                />
              </Router>
            </ProfilePopoverProvider>
          </LobbyProvider>
        </FriendsProvider>
      </GamesProvider>
    </AuthProvider>
  );
}

export default App;
