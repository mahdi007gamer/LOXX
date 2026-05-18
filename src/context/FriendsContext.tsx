import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Friend, FriendStatus, FriendRequest, FriendChat, ChatMessage, MembershipType } from "../types";

// ... (inside fetchFriends or wherever friends are set)

const sortFriends = (friendsList: Friend[]) => {
  return [...friendsList].sort((a, b) => {
    // 1. Status Priority (In Lobby > In Game > Online > Offline)
    const statusOrder = {
      [FriendStatus.IN_LOBBY]: 0,
      [FriendStatus.IN_GAME]: 1,
      [FriendStatus.ONLINE]: 2,
      [FriendStatus.OFFLINE]: 3,
    };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // 2. Membership Priority (VIP > PLUS > NONE)
    const membershipOrder = {
      [MembershipType.VIP]: 0,
      [MembershipType.PLUS]: 1,
      [MembershipType.NONE]: 2,
    };
    const aMem = a.membership || MembershipType.NONE;
    const bMem = b.membership || MembershipType.NONE;
    const memDiff = membershipOrder[aMem] - membershipOrder[bMem];
    if (memDiff !== 0) return memDiff;

    // 3. Alphabetical
    return a.username.localeCompare(b.username);
  });
};
import api from "../lib/api";
import { presenceSocket, chatSocket, notifySocket } from "../lib/socket";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

export interface FriendActivity {
  id: string;
  user: string;
  action: string;
  time: string;
}

interface FriendsContextType {
  friends: Friend[];
  requests: FriendRequest[];
  chats: FriendChat[];
  recentActivities: FriendActivity[];
  addFriend: (username: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  sendMessage: (friendId: string, text: string) => void;
  markAsRead: (friendId: string) => void;
  closeChat: (friendId: string) => void;
  openChat: (friendId: string, displayName?: string, avatarUrl?: string) => void;
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
  const [recentActivities, setRecentActivities] = useState<FriendActivity[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTrigger, setChatTrigger] = useState(0);
  const { user } = useAuth();
  const pendingPresenceSnapshot = React.useRef<{ userId: string, status: string }[] | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get("/friends/list");
      const fetchedFriends = response.data.data.items || [];
      
      setFriends(prev => {
        if (pendingPresenceSnapshot.current) {
          const snapshot = pendingPresenceSnapshot.current;
          pendingPresenceSnapshot.current = null;
          const updated = fetchedFriends.map((f: any) => {
            const statusData = snapshot.find(u => u.userId === f.id);
            const isAlreadyOnline = f.status !== "offline" && f.status !== FriendStatus.OFFLINE;
            return { 
              ...f, 
              status: statusData ? (statusData.status as FriendStatus) : (isAlreadyOnline ? f.status : FriendStatus.OFFLINE)
            };
          });
          return sortFriends(updated);
        }
        // Use API status, fallback to offline
        const initial = fetchedFriends.map((f: any) => ({ 
          ...f, 
          status: (f.status as FriendStatus) || FriendStatus.OFFLINE 
        }));
        return sortFriends(initial);
      });
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

      // Heartland interval every 4 minutes (since 5 is threshold)
      const presenceInterval = setInterval(() => {
        presenceSocket.emit("presence.update", { status: "online" });
      }, 4 * 60 * 1000);

      // Polling fallback to mitigate real-time issues across scalable nodes (without Redis Adapter)
      const fetchInterval = setInterval(() => {
        fetchFriends();
        fetchRequests();
      }, 15000);

      return () => {
        clearInterval(presenceInterval);
        clearInterval(fetchInterval);
      };
    }
  }, [user, fetchFriends, fetchRequests]);

  useEffect(() => {
    if (user) {
      // Listen for presence snapshot
      presenceSocket.on("presence.snapshot", (data: { users: { userId: string, status: string }[] }) => {
        setFriends(prev => {
          if (prev.length === 0) {
            pendingPresenceSnapshot.current = data.users;
            return prev;
          }
          const updated = prev.map(f => {
            const statusData = data.users.find(u => u.userId === f.id);
            // If API already says they are online, keep them online. Otherwise use snapshot data
            const isAlreadyOnline = f.status !== FriendStatus.OFFLINE;
            const status = statusData ? (statusData.status as FriendStatus) : (isAlreadyOnline ? f.status : FriendStatus.OFFLINE);
            return { ...f, status };
          });
          return sortFriends(updated);
        });
      });

      // Listen for presence changes using dot protocol
      presenceSocket.on("presence.changed", (data: { userId: string, status: string, activity?: string }) => {
        let friendName = "";
        setFriends(prev => {
          const friend = prev.find(f => f.id === data.userId);
          if (friend) friendName = friend.displayName || friend.username;
          
          const updated = prev.map(f => f.id === data.userId ? { 
            ...f, 
            status: data.status as FriendStatus,
            currentGame: data.activity 
          } : f);
          return sortFriends(updated);
        });

        if (friendName && data.status === "online") {
          toast(`${friendName} آنلاین شد`, { 
            icon: '🟢', 
            id: `online-${data.userId}` 
          });
        }
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
          senderLevel: from.level || 1,
          senderAvatar: from.avatar,
          badges: from.badges || [],
          self: isSelf,
          text: content,
          timestamp: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        };

        setChats(prev => {
          const existingChat = prev.find(c => c.friendId === friendId);
          if (existingChat) {
            // Check if this message was already added optimistically
            const isOptimisticMatch = data.tempId && existingChat.messages.some(m => m.id === data.tempId);
            
            if (isOptimisticMatch) {
              return prev.map(c => c.friendId === friendId 
                ? { 
                    ...c, 
                    messages: c.messages.map(m => m.id === data.tempId ? chatMsg : m)
                  } 
                : c);
            }

            // Normal duplicate check
            if (existingChat.messages.some(m => m.id === id)) return prev;

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
              unreadCount: (activeChatId === friendId || isSelf) ? 0 : 1,
              tempDisplayName: isSelf ? (targetId === "1" ? "شما" : undefined) : from.username,
              tempAvatarUrl: from.avatar
            }];
          }
        });

        if (!isSelf) {
          // If the message is not self, we show a toast
          // and if this chat is not the active one, we might notify differently
          // No need to forcefully open chat if not requested by user, but user said message icon not working.
          if (activeChatId !== friendId) {
            toast(`پیام جدید از ${from.username}`, { icon: '💬' });
          }
        }
      });

      // Notify Listeners
      const handleFriendRequestReceived = () => {
        toast("درخواست دوستی جدید", { icon: "👋" });
        fetchRequests();
      };

      const handleFriendListUpdated = () => {
        fetchFriends();
        fetchRequests();
      };

      notifySocket.on("friend_request_received", handleFriendRequestReceived);
      notifySocket.on("friend_request_responded", handleFriendListUpdated);
      notifySocket.on("friend_list_updated", handleFriendListUpdated);

      return () => {
        presenceSocket.off("presence.snapshot");
        presenceSocket.off("presence.changed");
        chatSocket.off("chat.message");
        notifySocket.off("friend_request_received", handleFriendRequestReceived);
        notifySocket.off("friend_request_responded", handleFriendListUpdated);
        notifySocket.off("friend_list_updated", handleFriendListUpdated);
      };
    }
  }, [user, activeChatId, fetchFriends, fetchRequests]);


  // Handle Lobby Invites globally - REMOVED: Now handled by NotificationHandler.tsx
  useEffect(() => {
    if (!user) return;
    
    // This handler was moved to NotificationHandler.tsx to consolidate 
    // all real-time notifications and use a consistent Glassmorphism UI.
    
  }, [user]);

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
      const existingReq = requests.find((r: any) => r.id === requestId);
      if (existingReq?.reqType === "elite_invite") {
         await api.post("/elite/members/accept", { notificationId: requestId });
         toast.success("شما با موفقیت به گروه پیوستید");
      } else {
         await api.post("/friends/respond", { request_id: requestId, action: "ACCEPTED" });
         toast.success("درخواست دوستی پذیرفته شد");
         fetchFriends();
      }
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "خطا در پذیرش درخواست");
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const existingReq = requests.find((r: any) => r.id === requestId);
      if (existingReq?.reqType === "elite_invite") {
         // Optionally add a decline URL, or just let them delete notification. 
         // Assuming we can simply delete the notification. Let's add an endpoint for it.
         // Actually, if we just let it be, they can't remove it. We'll add a decline via api.delete(`/notification/${requestId}`)
         await api.delete(`/notifications/${requestId}`);
      } else {
         await api.post("/friends/respond", { request_id: requestId, action: "DECLINED" });
      }
      toast.success("درخواست رد شد");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "خطا در رد درخواست");
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

  const openChat = async (friendId: string, displayName?: string, avatarUrl?: string) => {
    setChats(prev => {
      const existingChat = prev.find(c => c.friendId === friendId);
      if (existingChat) {
        if ((displayName && existingChat.tempDisplayName !== displayName) || (avatarUrl && existingChat.tempAvatarUrl !== avatarUrl)) {
          return prev.map(c => c.friendId === friendId ? { ...c, tempDisplayName: displayName, tempAvatarUrl: avatarUrl } : c);
        }
        return prev;
      }
      return [...prev, { friendId, messages: [], isTyping: false, unreadCount: 0, tempDisplayName: displayName, tempAvatarUrl: avatarUrl }];
    });

    try {
      const res = await api.get(`/chat/${friendId}/messages`, { params: { type: 'user', limit: 30 } });
      if (res.data.status === "success" && res.data.data) {
         setChats(prev => prev.map(c => {
           if (c.friendId === friendId) {
             const messages = res.data.data.map((msg: any) => {
                const isSelf = msg.from.userId === user?.id;
                return {
                  id: msg.id,
                  senderId: msg.from.userId,
                  senderName: msg.from.username,
                  senderLevel: msg.from.level || 1,
                  senderAvatar: msg.from.avatar,
                  badges: msg.from.badges || [],
                  self: isSelf,
                  text: msg.content,
                  timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isRead: true
                };
             });
             return { ...c, messages, unreadCount: 0 };
           }
           return c;
         }));
      }
    } catch (err) {
      console.error("Failed to load overlay chat history:", err);
    }

    setActiveChatId(friendId);
    setChatTrigger(t => t + 1);
  };

  const sendMessage = (friendId: string, text: string) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    
    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: user?.id || "",
      senderName: user?.username || "شما",
      senderAvatar: user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "guest"}`,
      senderLevel: 1,
      self: true,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    setChats(prev => prev.map(c => c.friendId === friendId 
      ? { ...c, messages: [...c.messages, optimisticMsg] } 
      : c
    ));

    chatSocket.emit("chat.send", { 
      target: { type: "user", id: friendId }, 
      content: text,
      tempId
    }, (res: any) => {
      if (res.status === "error") {
        toast.error(res.error?.message || "خطا در ارسال پیام");
        setChats(prev => prev.map(c => c.friendId === friendId 
          ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } 
          : c
        ));
      } else if (res.status === "ok") {
        setChats(prev => prev.map(c => c.friendId === friendId 
          ? { 
              ...c, 
              messages: c.messages.map(m => m.id === tempId ? { ...m, id: res.data.messageId } : m)
            } 
          : c
        ));
      }
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
      recentActivities,
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
