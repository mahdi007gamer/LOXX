import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns-jalali";
import api from "../../lib/api";
import { cn } from "../../lib/utils";
import { SmartImage } from "./SmartImage";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { useFriends } from "../../context/FriendsContext";
import { useLanguage } from "../../context/LanguageContext";

interface AppNotification {
  id: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  } | null;
}

export const NotificationCenter = () => {
  const { language, t } = useLanguage();
  const isRtl = language === "fa";
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [specialRewardModal, setSpecialRewardModal] = useState<AppNotification | null>(null);
  const navigate = useNavigate();
  const { openChat } = useFriends();

  const getDistanceToNow = (dateString: string) => {
    if (isRtl) {
      try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
      } catch (_) {
        return "اخیراً";
      }
    }
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (_) {
      return "Recently";
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const items = res.data.data?.items || [];
      setNotifications(items);
      setUnreadCount(items.filter((n: any) => !n.isRead).length || 0);

      // Check for special weekly reward
      const special = items.find((n: AppNotification) => !n.isRead && n.type === "WEEKLY_REWARD" && n.data?.showModal);
      if (special) {
        setSpecialRewardModal(special);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30 * 1000);

    const handleNewNotification = (data: any) => {
      // Refresh notifications when a new one comes in to keep it perfectly synced
      // Or we could optimistically update
      fetchNotifications();
    };

    import("../../lib/socket").then(({ notifySocket }) => {
      notifySocket.on("notification", handleNewNotification);
    });

    return () => {
      clearInterval(interval);
      import("../../lib/socket").then(({ notifySocket }) => {
        notifySocket.off("notification", handleNewNotification);
      });
    };
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      if (id) {
        await api.post(`/notifications/read`, { ids: [id] });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post(`/notifications/read`, { all: true });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      toast.error(t("errorNotifications"));
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    setIsOpen(false);
    
    // routing logic based on type
    if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPTED') {
      navigate('/friends');
    } else if (n.type === 'LOBBY_INVITE') {
      const lobbyId = n.data?.lobbyId;
      if (lobbyId) navigate(`/lobbies/${lobbyId}`);
    } else if (n.type === 'GROUP_INVITE') {
      const channelId = n.data?.channelId;
      if (channelId) navigate(`/chat`);
    } else if (n.type === 'MESSAGE_RECEIVED' || n.type === 'FRIEND_ACTIVITY') {
      const senderId = n.data?.senderId || n.sender?.id;
      if (senderId) openChat(senderId, n.data?.username || n.sender?.username);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-2 w-80 sm:w-96 rounded-xl border border-white/10 bg-dark-bg shadow-2xl z-50 overflow-hidden ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4" dir={isRtl ? "rtl" : "ltr"}>
                <h3 className="font-semibold text-white">{t("notificationsTitle")}</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAsRead()}
                    className="text-xs text-brand-primary hover:text-brand-light transition-colors cursor-pointer"
                  >
                    {t("markAllRead")}
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto w-full">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    <Bell className="mx-auto h-8 w-8 opacity-20 mb-3" />
                    {t("noAlerts")}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 w-full">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "cursor-pointer p-4 transition-all hover:bg-white/5 flex gap-3",
                          !n.isRead ? "bg-brand-primary/5" : ""
                        )}
                      >
                        {n.sender?.avatarUrl ? (
                          <SmartImage src={n.sender.avatarUrl || ""} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className={cn("flex-1 w-full min-w-0 flex flex-col items-start", isRtl ? "text-right" : "text-left")}>
                          <p className={cn("text-sm", isRtl ? "text-right" : "text-left", !n.isRead ? "text-white font-medium" : "text-gray-300")}>
                            {n.data?.message || t("newNotification")}
                          </p>
                          <span className={cn("mt-1 text-xs text-gray-500 w-full block", isRtl ? "text-right" : "text-left")}>
                            {getDistanceToNow(n.createdAt)}
                          </span>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(0,229,255,0.8)] self-center" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {specialRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-gradient-to-b from-[#1a140a] to-dark-bg border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_80px_rgba(234,179,8,0.2)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-32 bg-yellow-500/20 blur-3xl rounded-full" />
              
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 p-[2px] shadow-2xl shadow-yellow-500/40 relative z-10 mb-6 flex items-center justify-center">
                <div className="w-full h-full bg-dark-bg rounded-full flex items-center justify-center overflow-hidden relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-yellow-500/20" />
                  <span className="text-4xl text-yellow-400 font-black relative z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">🏆</span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white italic capitalize mb-2">{t("congrats")}</h2>
              <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest mb-6">{t("weeklyRank").replace("{rank}", specialRewardModal.data?.rank)}</p>

              <p className="text-sm text-gray-300 font-bold leading-relaxed mb-8">
                {specialRewardModal.data?.message}
              </p>

              <button
                onClick={async () => {
                   await markAsRead(specialRewardModal.id);
                   setSpecialRewardModal(null);
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 text-dark-bg font-black uppercase italic tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.4)] relative z-10 cursor-pointer"
              >
                {t("claimReward")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
