import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Friend, FriendStatus, FriendRequest, FriendChat, ChatMessage } from "../types";
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
          return fetchedFriends.map((f: Friend) => {
            const statusData = snapshot.find(u => u.userId === f.id);
            return { 
              ...f, 
              status: statusData ? (statusData.status as FriendStatus) : FriendStatus.OFFLINE 
            };
          });
        }
        // Default all to offline if no snapshot yet (will be updated by realtime events)
        return fetchedFriends.map((f: Friend) => ({ ...f, status: FriendStatus.OFFLINE }));
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

      // Listen for presence snapshot
      presenceSocket.on("presence.snapshot", (data: { users: { userId: string, status: string }[] }) => {
        setFriends(prev => {
          if (prev.length === 0) {
            pendingPresenceSnapshot.current = data.users;
            return prev;
          }
          return prev.map(f => {
            const statusData = data.users.find(u => u.userId === f.id);
            const status = (statusData ? statusData.status : "offline") as FriendStatus;
            return { ...f, status };
          });
        });
      });

      // Listen for presence changes using dot protocol
      presenceSocket.on("presence.changed", (data: { userId: string, status: string, activity?: string }) => {
        setFriends(prev => {
          const friend = prev.find(f => f.id === data.userId);
          // If friend is transitioning to online from something else, toast
          // We use a specific ID for the toast to avoid duplicates if multiple connections emit changed
          if (friend && friend.status !== "online" && data.status === "online") {
             toast(`${friend.displayName || friend.username} آنلاین شد`, { 
               icon: '🟢', 
               id: `online-${data.userId}` 
             });
          }
          return prev.map(f => f.id === data.userId ? { 
            ...f, 
            status: data.status as FriendStatus,
            currentGame: data.activity 
          } : f);
        });
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
          // Play a simple notification sound
          try {
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

      // Notify Listeners
      const handleFriendRequestReceived = () => {
        toast("درخواست دوستی جدید", { icon: "👋" });
        fetchRequests();
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
      };

      const handleFriendListUpdated = () => {
        fetchFriends();
        fetchRequests();
      };

      notifySocket.on("friend_request_received", handleFriendRequestReceived);
      notifySocket.on("friend_request_responded", handleFriendListUpdated);
      notifySocket.on("friend_list_updated", handleFriendListUpdated);

      return () => {
        clearInterval(presenceInterval);
        presenceSocket.off("presence.changed");
        chatSocket.off("chat.message");
        notifySocket.off("friend_request_received", handleFriendRequestReceived);
        notifySocket.off("friend_request_responded", handleFriendListUpdated);
        notifySocket.off("friend_list_updated", handleFriendListUpdated);
      };
    }
  }, [user, activeChatId, fetchFriends, fetchRequests]);

  // Handle Lobby Invites globally
  useEffect(() => {
    if (!user) return;
    const handleLobbyInvite = (data: { lobbyId: string, fromId: string, fromUsername: string, gameTitle: string }) => {
      toast.custom(
        (t) => (
          <div 
            className={cn(
              "bg-[#0a0a0f]/95 backdrop-blur-2xl border border-neon-purple/50 p-5 rounded-[2rem] shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)] flex flex-col gap-4 min-w-[320px] max-w-[400px] transition-all duration-300",
              t.visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-[-20px] opacity-0 scale-95"
            )}
            style={{ 
              zIndex: 999999999, // Extremely high z-index
              position: 'relative' 
            }}
          >
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple text-lg border border-neon-purple/30 shadow-inner">🎮</div>
               <div className="flex-1">
                 <p className="font-bold text-white text-sm">{data.fromUsername} شما را دعوت کرده</p>
                 <p className="text-xs text-gray-400">به لابی {data.gameTitle} بپیوندید</p>
               </div>
             </div>
             <div className="flex gap-2 w-full mt-2">
               <button onClick={() => {
                 toast.dismiss(t.id);
                 api.post(`/lobby/${data.lobbyId}/join`).then(() => {
                    toast.success("وارد لابی شدید");
                    window.location.href = `/lobby/${data.lobbyId}`;
                 }).catch(() => toast.error("لابی در دسترس نیست"));
               }} className="flex-1 bg-neon-blue text-dark-bg font-black py-2 rounded-xl text-xs hover:bg-white transition-all shadow-[0_0_15px_-3px_rgba(0,229,255,0.4)]">
                 قبول دعوت
               </button>
               <button onClick={() => {
                 toast.dismiss(t.id);
                 // We could notify sender here using dot protocol or API
               }} className="flex-1 bg-dark-card border border-white/10 text-gray-400 font-bold py-2 rounded-xl text-xs hover:text-white hover:bg-white/5 transition-all">
                 رد کردن
               </button>
             </div>
          </div>
        ),
        { duration: 15000, position: 'top-center' }
      );
    }
    
    // assuming notifySocket is exported from socket.ts
    import("../lib/socket").then(({ notifySocket }) => {
       notifySocket.on("lobby.invite", handleLobbyInvite);
    });

    return () => {
       import("../lib/socket").then(({ notifySocket }) => {
          notifySocket.off("lobby.invite", handleLobbyInvite);
       });
    }
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
