import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns-jalali";
import api from "../../lib/api";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";

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
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.notifications?.filter((n: any) => !n.isRead).length || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30 * 1000);
    return () => clearInterval(interval);
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
      toast.error("خطا در به روزرسانی اعلان ها");
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
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold text-white">اعلان‌ها</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAsRead()}
                    className="text-xs text-brand-primary hover:text-brand-light transition-colors"
                  >
                    خواندن همه
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto w-full">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    <Bell className="mx-auto h-8 w-8 opacity-20 mb-3" />
                    هیچ اعلانی ندارید
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
                          <img src={n.sender.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 w-full min-w-0 flex flex-col items-start text-right">
                          <p className={cn("text-sm text-right", !n.isRead ? "text-white font-medium" : "text-gray-300")}>
                            {n.data?.message || 'شما یک اعلان جدید دارید.'}
                          </p>
                          <span className="mt-1 text-xs text-gray-500 w-full text-right block">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
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
    </div>
  );
};
