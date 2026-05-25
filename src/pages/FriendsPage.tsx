import React, { useState, useMemo, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { useFriends } from "../context/FriendsContext";
import { useAuth } from "../context/AuthContext";
import { Friend, FriendStatus, FriendRequest } from "../types";
import api from "../lib/api";
import { notifySocket } from "../lib/socket";
import { SmartImage } from "../components/ui/SmartImage";
import { getAvatarFallbacks } from "../lib/avatar";
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  UserCheck, 
  X, 
  ChevronDown, 
  ChevronUp,
  Star,
  MoreVertical,
  Bell,
  Trash2,
  Ban,
  VolumeX,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

import { useProfilePopover } from "../context/ProfilePopoverContext";
import { MembershipType } from "../types";

const StatusBadge = ({ status }: { status: FriendStatus }) => {
  const colors = {
    [FriendStatus.ONLINE]: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
    [FriendStatus.IN_GAME]: "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.5)]",
    [FriendStatus.IN_LOBBY]: "bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.5)]",
    [FriendStatus.OFFLINE]: "bg-gray-500",
  };
  return <div className={cn("h-2.5 w-2.5 rounded-full", colors[status])} />;
};

const FriendItem = ({ 
  friend, 
  toggleFavorite, 
  toggleMute, 
  toggleBlock, 
  removeFriend, 
  openChat 
}: { 
  friend: Friend;
  toggleFavorite: (id: string) => void;
  toggleMute: (id: string) => void;
  toggleBlock: (id: string) => void;
  removeFriend: (id: string) => void;
  openChat: (id: string, name?: string, avatar?: string) => void;
  key?: React.Key;
}) => {
  const [showMobileActions, setShowMobileActions] = useState(false);
  const { openProfile } = useProfilePopover();

  const isVip = (friend as any).membership === 'VIP';
  const isPlus = (friend as any).membership === 'PLUS';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex flex-col rounded-2xl p-3 transition-all",
        isVip ? "bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/30 hover:border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.15)]" :
        isPlus ? "bg-gradient-to-r from-neon-blue/10 to-transparent border border-neon-blue/30 hover:border-neon-blue/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]" :
        "bg-white/5 hover:bg-white/10 border border-transparent",
        showMobileActions && (!isVip && !isPlus) ? "bg-white/10 scale-[1.02] border-neon-blue/20 border" : ""
      )}
      onClick={() => {
        // Toggle mobile actions on tap for small screens
        if (window.innerWidth < 1024) {
          setShowMobileActions(!showMobileActions);
        }
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="relative group/avatar cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            openProfile({
              senderName: friend.displayName,
              senderAvatar: friend.avatarUrl || friend.avatar,
              senderLevel: friend.level,
              id: friend.id,
              // We might not have full metadata here, but we can pass basic info
              membership: (friend as any).membership || MembershipType.NONE,
              vipMetadata: (friend as any).vipMetadata,
              bannerUrl: (friend as any).bannerUrl || (friend as any).avatarUrl || friend.avatar
            }, false);
          }}>
            <div className={cn("h-12 w-12 rounded-full overflow-hidden flex items-center justify-center border transition-all",
               isVip ? "bg-yellow-400/20 border-yellow-400/50" : isPlus ? "bg-neon-blue/20 border-neon-blue/50" : "bg-white/10 border-white/5 group-hover/avatar:border-neon-blue/50"
            )}>
               <SmartImage 
                 src={friend.avatarUrl || friend.avatar} 
                 alt={friend.username}
                 fallbacks={getAvatarFallbacks(friend.username)}
                 className="w-full h-full object-cover"
                 isVipEnabled={isVip || isPlus}
               />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 border-2 border-dark-bg rounded-full p-0.5 bg-dark-bg z-10">
              <StatusBadge status={friend.status} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link 
                to={`/profile/${friend.username}`} 
                className={cn("font-bold transition-colors hover:text-white", 
                  isVip ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" : 
                  isPlus ? "text-neon-blue drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" : "text-white"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {friend.displayName}
              </Link>
              {friend.isFavorite && <Star size={12} className="fill-neon-blue text-neon-blue" />}
              <span className="text-[10px] text-gray-500">Lv.{friend.level}</span>
            </div>
            <p className="text-xs text-gray-400">
              {friend.status === FriendStatus.IN_GAME ? `در حال بازی ${friend.currentGame}` : 
               friend.status === FriendStatus.IN_LOBBY ? "داخل لابی" : 
               friend.status === FriendStatus.ONLINE ? "آنلاین" : 
               friend.lastSeen ? `آخرین بازدید ${friend.lastSeen}` : "آفلاین"}
            </p>
          </div>
        </div>

        {/* Desktop Actions (Hover) */}
        <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); openChat(friend.id, friend.displayName, friend.avatarUrl || friend.avatar); }} 
            className="p-2 text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all" 
            title="ارسال پیام"
          >
            <MessageSquare size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(friend.id); }} 
            className={cn("p-2 rounded-lg transition-all", friend.isFavorite ? "text-neon-blue" : "text-gray-400 hover:text-neon-blue")} 
            title="علاقه‌مندی"
          >
            <Star size={18} className={friend.isFavorite ? "fill-neon-blue" : ""} />
          </button>
          <div className="relative group/menu">
            <button className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
              <MoreVertical size={18} />
            </button>
            <AnimatePresence>
              <div className="absolute left-0 top-full z-50 group-hover/menu:block hidden pt-1">
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="w-44 rounded-xl bg-[#0a0a0f]/98 border border-white/10 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute(friend.id);
                    }} 
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all text-right" 
                    dir="rtl"
                  >
                    {friend.isMuted ? <Bell size={14} className="text-neon-blue" /> : <VolumeX size={14} />}
                    {friend.isMuted ? "خروج از بی‌صدا" : "بی‌صدا کردن"}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBlock(friend.id);
                    }} 
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all text-right" 
                    dir="rtl"
                  >
                    <Ban size={14} className={friend.isBlocked ? "text-neon-blue" : ""} />
                    {friend.isBlocked ? "آنبلاک" : "بلاک کردن"}
                  </button>
                  <div className="my-1 h-px bg-white/5" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFriend(friend.id);
                    }} 
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-neon-pink hover:bg-neon-pink/10 transition-all text-right" 
                    dir="rtl"
                  >
                    <Trash2 size={14} />
                    حذف دوست
                  </button>
                </motion.div>
              </div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Mobile Indicator */}
        <div className="lg:hidden text-gray-600">
           {showMobileActions ? <ChevronUp size={16} /> : <MessageSquare size={16} />}
        </div>
      </div>

      {/* Mobile Quick Actions (Expanded) */}
      <AnimatePresence>
        {showMobileActions && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/5 mt-3 pt-3 flex items-center justify-around overflow-hidden"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); openChat(friend.id, friend.displayName, friend.avatarUrl || friend.avatar); }}
              className="flex flex-col items-center gap-1.5 p-2 text-neon-blue"
            >
              <div className="h-10 w-10 rounded-full bg-neon-blue/10 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <span className="text-[10px] font-black uppercase">چت</span>
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(friend.id); }}
              className={cn("flex flex-col items-center gap-1.5 p-2", friend.isFavorite ? "text-yellow-500" : "text-gray-500")}
            >
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", friend.isFavorite ? "bg-yellow-500/10" : "bg-white/5")}>
                <Star size={20} className={friend.isFavorite ? "fill-current" : ""} />
              </div>
              <span className="text-[10px] font-black uppercase">محبوب</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(friend.id); }}
              className={cn("flex flex-col items-center gap-1.5 p-2", friend.isMuted ? "text-neon-pink" : "text-gray-500")}
            >
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", friend.isMuted ? "bg-neon-pink/10" : "bg-white/5")}>
                {friend.isMuted ? <Bell size={20} /> : <VolumeX size={20} />}
              </div>
              <span className="text-[10px] font-black uppercase">{friend.isMuted ? "صدا" : "بی‌صدا"}</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); removeFriend(friend.id); }}
              className="flex flex-col items-center gap-1.5 p-2 text-gray-500 hover:text-neon-pink"
            >
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <span className="text-[10px] font-black uppercase">حذف</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FriendsPage = () => {
  const { 
    friends, 
    requests, 
    addFriend, 
    acceptRequest, 
    declineRequest, 
    cancelRequest, 
    removeFriend,
    toggleFavorite,
    toggleBlock,
    toggleMute,
    openChat
  } = useFriends();
  const { user, isSidebarCollapsed } = useAuth();
  const { openProfile } = useProfilePopover();

  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({
    inGame: false,
    inLobby: true,
    online: true,
    offline: false
  });

  const getScore = (f: any) => f.membership === 'VIP' ? 2 : f.membership === 'PLUS' ? 1 : 0;

  const [activities, setActivities] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ level: (user as any)?.level || 1, points: (user as any)?.points || 0 });

  // Format activity action helper
  const getActivityText = (act: any) => {
    switch (act.type) {
      case 'LEVEL_UP':
        const levelData = act.data ? JSON.parse(act.data) : { level: 'جدید' };
        return `سطح خود را به ${levelData.level} ارتقا داد`;
      case 'LOBBY_JOIN':
        const lobbyData = act.data ? JSON.parse(act.data) : { title: 'یک لابی' };
        return `به لابی ${lobbyData.title} پیوست`;
      case 'NEW_FRIEND':
        return `دوست جدید پیدا کرد`;
      default:
        return 'فعالیتی انجام داد';
    }
  };

  useEffect(() => {
    if (user?.id) {
       api.get(`/users/me`).then(res => {
         if (res.data.status === "success" && res.data.data) {
            setUserStats({ level: res.data.data.level, points: res.data.data.xp });
         }
       }).catch(err => console.warn("Failed to load live user stats", err));
    }
    
    api.get("/friendships/activities").then(res => {
      if (res.data.status === "success") {
        setActivities(res.data.data);
      }
    });

    const handleFriendActivity = (data: any) => {
      setActivities(prev => [data, ...prev].slice(0, 20));
    };

    notifySocket.on("friends.activity", handleFriendActivity);
    return () => {
      notifySocket.off("friends.activity", handleFriendActivity);
    };
  }, []);

  const filteredFriends = useMemo(() => {
    return friends.filter(f => 
      f.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => getScore(b) - getScore(a));
  }, [friends, searchTerm]);

  const favorites = filteredFriends.filter(f => f.isFavorite);
  const inGame = filteredFriends.filter(f => f.status === FriendStatus.IN_GAME && !f.isFavorite);
  const inLobby = filteredFriends.filter(f => f.status === FriendStatus.IN_LOBBY && !f.isFavorite);
  const online = filteredFriends.filter(f => f.status === FriendStatus.ONLINE && !f.isFavorite);
  const offline = filteredFriends.filter(f => f.status === FriendStatus.OFFLINE && !f.isFavorite)
    .sort((a,b) => (a.lastSeen || "").localeCompare(b.lastSeen || ""));

  const toggleCategory = (cat: keyof typeof expandedCategories) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] overflow-x-hidden">
      <Sidebar />
      <main className={cn("flex-1 px-4 py-8 lg:px-8 pb-24 md:pb-8 w-full transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")} dir="rtl">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-8 md:mb-10 text-center md:text-right">
            <h1 className="text-2xl md:text-3xl font-black text-white">دوستان و اجتماعی</h1>
            <p className="mt-1 text-xs md:text-base text-gray-400">مدیریت دوستان، جستجوی بازیکنان و درخواست‌ها</p>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Friend List & Search */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="text" 
                  placeholder="جستجو در لیست دوستان..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pr-12 text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-all placeholder:text-gray-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Friends Sections */}
              <div className="space-y-4">
                  {/* Favorites */}
                  <AnimatePresence>
                    {favorites.length > 0 && (
                      <div className="space-y-2 mb-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-neon-blue uppercase tracking-wider px-2">
                          <Star size={10} className="fill-neon-blue" />
                          علاقه‌مندی‌ها
                        </div>
                        {favorites.map(friend => (
                          <FriendItem 
                            key={friend.id} 
                            friend={friend} 
                            toggleFavorite={toggleFavorite}
                            toggleMute={toggleMute}
                            toggleBlock={toggleBlock}
                            removeFriend={removeFriend}
                            openChat={openChat}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Regular Categories */}
                  {[
                    { id: 'inGame', label: 'در حال بازی', items: inGame, count: inGame.length, color: 'text-neon-purple' },
                    { id: 'inLobby', label: 'در لابی', items: inLobby, count: inLobby.length, color: 'text-neon-blue' },
                    { id: 'online', label: 'آنلاین', items: online, count: online.length, color: 'text-green-500' },
                    { id: 'offline', label: 'آفلاین', items: offline, count: offline.length, color: 'text-gray-500' },
                  ].map((cat) => (
                    <div key={cat.id} className="space-y-2">
                       <button 
                        onClick={() => toggleCategory(cat.id as any)}
                        className="flex w-full items-center justify-between px-2 py-1 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors"
                       >
                         <div className="flex items-center gap-2">
                           <div className={cn("h-1.5 w-1.5 rounded-full bg-current", cat.color)} />
                           {cat.label} ({cat.count})
                         </div>
                         {expandedCategories[cat.id as keyof typeof expandedCategories] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                       </button>

                       <AnimatePresence>
                        {expandedCategories[cat.id as keyof typeof expandedCategories] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-visible space-y-1"
                          >
                            {cat.items.map(friend => (
                              <FriendItem 
                                key={friend.id} 
                                friend={friend} 
                                toggleFavorite={toggleFavorite}
                                toggleMute={toggleMute}
                                toggleBlock={toggleBlock}
                                removeFriend={removeFriend}
                                openChat={openChat}
                              />
                            ))}
                            {cat.count === 0 && <p className="py-4 text-center text-[10px] text-gray-600 italic">هیچ موردی یافت نشد</p>}
                          </motion.div>
                        )}
                       </AnimatePresence>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right Column: User Search & Requests */}
            <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
               {/* Mini Profile */}
                <NeonCard variant="purple" className="p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-24 w-24 -mr-12 -mt-12 rounded-full bg-neon-purple/10 blur-2xl group-hover:bg-neon-purple/20 transition-all duration-700" />
                  <div className="relative flex items-center gap-4">
                     <div 
                       className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl md:text-2xl shadow-2xl overflow-hidden cursor-pointer hover:border-white/30 transition-all"
                       onClick={() => {
                         if (user) {
                           openProfile({
                             senderName: user.displayName || user.username,
                             senderAvatar: user.avatarUrl,
                             senderLevel: (user as any).level || 1,
                             id: user.id,
                             membership: user.membership || MembershipType.NONE,
                             vipMetadata: user.vipMetadata,
                             bannerUrl: (user as any).bannerUrl || user.avatarUrl
                           }, true);
                         }
                       }}
                     >
                        <SmartImage 
                          src={user?.avatarUrl} 
                          alt="avatar" 
                          fallbacks={user ? getAvatarFallbacks(user.username) : []}
                          className="w-full h-full object-cover" 
                        />
                     </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-white text-base md:text-lg truncate">{user?.displayName || user?.username}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-tighter truncate">@{user?.username}</span>
                        <button 
                          onClick={() => {
                            if(user) navigator.clipboard.writeText(`@${user.username}`);
                            toast.success("آیدی کپی شد");
                          }}
                          className="p-1 text-gray-600 hover:text-neon-purple transition-colors shrink-0"
                          title="کپی کردن نام کاربری"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                         <div className="flex flex-col">
                           <span className="text-[8px] md:text-[10px] text-gray-600 uppercase font-bold">سطح</span>
                           <span className="text-xs md:text-sm font-black text-neon-purple">{userStats.level}</span>
                         </div>
                         <div className="w-px h-6 bg-white/5" />
                         <div className="flex flex-col">
                           <span className="text-[8px] md:text-[10px] text-gray-600 uppercase font-bold">امتیاز</span>
                           <span className="text-xs md:text-sm font-black text-neon-blue">{userStats.points}</span>
                         </div>
                      </div>
                    </div>
                    <Link to={`/profile/${user?.username}`} className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0">
                      <ExternalLink size={16} />
                    </Link>
                 </div>
               </NeonCard>

               {/* Global User Search */}
               <NeonCard variant="blue" className="p-6">
                 <h3 className="text-lg font-bold text-white mb-4">یافتن همراه جدید</h3>
                 <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                        type="text" 
                        placeholder="آیدی کاربر..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 text-xs text-white focus:border-neon-blue/50 focus:outline-none transition-all"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && userSearchTerm.length > 0) {
                            addFriend(userSearchTerm);
                            setUserSearchTerm('');
                          }
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center border-t border-white/5 pt-2">
                      جهت ارسال درخواست دوستی، آیدی دقیق کاربر را وارد کرده و دکمه Enter را بزنید.
                    </p>
                 </div>
               </NeonCard>

               {/* Friend Requests */}
               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    درخواست‌ها
                    {requests.length > 0 && <span className="bg-neon-pink text-white text-[10px] px-1.5 rounded-full">{requests.length}</span>}
                  </h3>
                  
                  {requests.map(req => (
                    <NeonCard key={req.id} variant={req.type === 'incoming' ? 'purple' : 'blue'} className="p-4">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div 
                             className="h-10 w-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
                             onClick={() => {
                               openProfile({
                                 senderName: req.displayName,
                                 senderAvatar: req.avatarUrl || req.avatar,
                                 senderLevel: (req as any).level || 1,
                                 id: req.userId || req.id,
                                 membership: (req as any).membership || MembershipType.NONE,
                                 vipMetadata: (req as any).vipMetadata,
                                 bannerUrl: (req as any).bannerUrl || (req as any).avatarUrl || req.avatar
                               }, false);
                             }}
                            >
                             {((req.avatar || (req as any).avatarUrl) && ((req.avatar || (req as any).avatarUrl).length > 5 || (req.avatar || (req as any).avatarUrl).startsWith("/") || (req.avatar || (req as any).avatarUrl).includes("."))) ? (
                               <img src={req.avatar || (req as any).avatarUrl} alt={req.displayName} className="w-full h-full object-cover" />
                             ) : (
                               <span className="text-lg">{req.avatar || (req as any).avatarUrl || "👤"}</span>
                             )}
                           </div>
                           <div>
                             <p className="text-xs font-bold text-white">{req.displayName}</p>
                             <p className="text-[10px] text-gray-500">{(req as any).reqType === 'elite_invite' ? "دعوت به گروه نخبگان" : req.type === 'incoming' ? "درخواست دوستی" : "در انتظار تایید"}</p>
                           </div>
                         </div>
                         <p className="text-[9px] text-gray-600">{req.timestamp}</p>
                       </div>
                       
                       <div className="flex gap-2">
                         {req.type === 'incoming' ? (
                           <>
                             <GlowButton variant="purple" size="sm" className="flex-1 text-[10px]" onClick={() => acceptRequest(req.id)}>تایید</GlowButton>
                             <button className="flex-1 rounded-lg border border-white/5 bg-white/5 text-[10px] text-gray-400 hover:bg-neon-pink/10 hover:text-neon-pink transition-all" onClick={() => declineRequest(req.id)}>رد کردن</button>
                           </>
                         ) : (
                           <button className="w-full rounded-lg border border-white/5 bg-white/5 py-2 text-[10px] text-gray-400 hover:text-neon-pink transition-all" onClick={() => cancelRequest(req.userId)}>لغو درخواست</button>
                         )}
                       </div>
                    </NeonCard>
                  ))}

                  {requests.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-white/5 opacity-50">
                       <UserPlus size={24} className="text-gray-600 mb-2" />
                       <p className="text-[10px] text-gray-600">درخواستی ندارید</p>
                    </div>
                  )}
               </div>

               {/* Activity Feed */}
               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">فعالیت‌های اخیر</h3>
                  <div className="space-y-3">
                    {activities.length > 0 ? activities.map((act) => (
                      <div key={act.id} className="flex gap-3 text-xs border-r-2 border-neon-blue/30 pr-3">
                        <div className="flex-1">
                          <span className="font-bold text-white">{act.user?.username || act.user?.profile?.displayName || "ناشناس"}</span>
                          <span className="text-gray-400 mx-1">{getActivityText(act)}</span>
                          <p className="text-[9px] text-gray-600">{new Date(act.createdAt).toLocaleTimeString('fa-IR')} - {new Date(act.createdAt).toLocaleDateString('fa-IR')}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-xs text-gray-500 py-4">فعالیتی وجود ندارد</div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
