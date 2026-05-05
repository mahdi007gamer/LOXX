import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Friend, FriendStatus, FriendRequest, FriendChat, ChatMessage } from "../types";
import api from "../lib/api";
import { presenceSocket, chatSocket } from "../lib/socket";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

interface FriendsContextType {
  friends: Friend[];
  requests: FriendRequest[];
  chats: FriendChat[];
  addFriend: (username: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  sendMessage: (friendId: string, text: string) => void;
  markAsRead: (friendId: string) => void;
  closeChat: (friendId: string) => void;
  openChat: (friendId: string, displayName?: string) => void;
  toggleFavorite: (friendId: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  chatTrigger: number;
  toggleBlock: (friendId: string) => void;
  toggleMute: (friendId: string) => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [chats, setChats] = useState<FriendChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTrigger, setChatTrigger] = useState(0);
  const { user } = useAuth();

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get("/friends/list");
      setFriends(response.data.data.items || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get("/friends/requests");
      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchRequests();

      // Listen for presence changes using dot protocol
      presenceSocket.on("presence.changed", (data: { userId: string, status: string, activity?: string }) => {
        setFriends(prev => prev.map(f => f.id === data.userId ? { 
          ...f, 
          status: data.status as FriendStatus,
          currentGame: data.activity 
        } : f));
      });

      // Listen for incoming chat messages using dot protocol
      chatSocket.on("chat.message", (data: any) => {
        if (data.targetType === "lobby" || data.targetType === "channel") return;

        const { id, from, content, createdAt, targetId } = data;
        const isSelf = from.userId === user.id;
        const friendId = isSelf ? targetId : from.userId;

        const chatMsg: ChatMessage = {
          id: id,
          senderId: from.userId,
          senderName: from.username,
          senderLevel: 1, // Defaulting as backend didn't send level
          self: isSelf,
          text: content,
          timestamp: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        };

        setChats(prev => {
          const existingChat = prev.find(c => c.friendId === friendId);
          if (existingChat) {
            return prev.map(c => c.friendId === friendId 
              ? { 
                  ...c, 
                  messages: [...c.messages, chatMsg],
                  unreadCount: (activeChatId === friendId || isSelf) ? 0 : c.unreadCount + 1
                } 
              : c);
          } else {
            return [...prev, { 
              friendId: friendId, 
              messages: [chatMsg], 
              isTyping: false, 
              unreadCount: (activeChatId === friendId || isSelf) ? 0 : 1 
            }];
          }
        });

        if (!isSelf && activeChatId !== friendId) {
          toast(`پیام جدید از ${from.username}`, { icon: '💬' });
          // Force open chat panel
          setActiveChatId(friendId);
          setChatTrigger(t => t + 1);
          // Play a simple notification sound (using base64 inline audio to avoid missing assets)
          try {
            const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"); // tiny silent/beep header, better to just use a real URL if exists or construct oscillator
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          } catch(e) {}
        }
      });

      return () => {
        presenceSocket.off("presence.changed");
        chatSocket.off("chat.message");
      };
    }
  }, [user, activeChatId, fetchFriends, fetchRequests]);

  const addFriend = async (username: string) => {
    try {
      await api.post("/friends/request", { username });
      toast.success("درخواست دوستی ارسال شد");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "ارسال درخواست با خطا مواجه شد");
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await api.post("/friends/respond", { request_id: requestId, action: "ACCEPTED" });
      toast.success("درخواست دوستی پذیرفته شد");
      fetchRequests();
      fetchFriends();
    } catch (error) {
      toast.error("خطا در پذیرش درخواست");
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await api.post("/friends/respond", { request_id: requestId, action: "DECLINED" });
      toast.success("درخواست رد شد");
      fetchRequests();
    } catch (error) {
      toast.error("خطا در رد درخواست");
    }
  };

  const cancelRequest = async (targetUserId: string) => {
    try {
      await api.delete(`/friends/${targetUserId}`);
      toast.success("درخواست لغو شد");
      fetchRequests();
    } catch (error) {
      toast.error("خطا در لغو درخواست");
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await api.delete(`/friends/${friendId}`);
      toast.success("دوست از لیست حذف شد");
      fetchFriends();
    } catch (error) {
      toast.error("خطا در حذف دوست");
    }
  };

  const openChat = (friendId: string, displayName?: string) => {
    setChats(prev => {
      const existingChat = prev.find(c => c.friendId === friendId);
      if (existingChat) return prev;
      return [...prev, { friendId, messages: [], isTyping: false, unreadCount: 0, tempDisplayName: displayName }];
    });
    setActiveChatId(friendId);
    setChatTrigger(t => t + 1);
  };

  const sendMessage = (friendId: string, text: string) => {
    chatSocket.emit("chat.send", { 
      target: { type: "user", id: friendId }, 
      content: text,
      tempId: Math.random().toString(36).substr(2, 9)
    });
  };

  const markAsRead = (friendId: string) => {
    setChats(prev => prev.map(c => c.friendId === friendId ? { ...c, unreadCount: 0 } : c));
  };

  const closeChat = (friendId: string) => {
    setChats(prev => prev.filter(c => c.friendId !== friendId));
    if (activeChatId === friendId) setActiveChatId(null);
  };

  const toggleFavorite = async (friendId: string) => {
     try {
       await api.patch(`/friends/${friendId}/favorite`);
       setFriends(prev => prev.map(f => f.id === friendId ? { ...f, isFavorite: !f.isFavorite } : f));
     } catch (error) {
        toast.error("خطا در تغییر وضعیت موردعلاقه");
     }
  };

  const toggleBlock = async (friendId: string) => {
     try {
       await api.patch(`/friends/${friendId}/block`);
       fetchFriends(); // refetch because blocked friends are removed from list
       toast.success("وضعیت تغییر کرد");
     } catch (error) {
        toast.error("خطا در تغییر وضعیت بلاک");
     }
  };

  const toggleMute = async (friendId: string) => {
     try {
       await api.patch(`/friends/${friendId}/mute`);
       setFriends(prev => prev.map(f => f.id === friendId ? { ...f, isMuted: !f.isMuted } : f));
     } catch (error) {
        toast.error("خطا در تغییر وضعیت میوت");
     }
  };

  return (
    <FriendsContext.Provider value={{
      friends,
      requests,
      chats,
      activeChatId,
      setActiveChatId,
      chatTrigger,
      addFriend,
      acceptRequest,
      declineRequest,
      cancelRequest,
      removeFriend,
      sendMessage,
      openChat,
      markAsRead,
      closeChat,
      toggleFavorite,
      toggleBlock,
      toggleMute
    }}>
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) throw new Error("useFriends must be used within a FriendsProvider");
  return context;
};
