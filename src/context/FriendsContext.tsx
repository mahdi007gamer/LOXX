import React, { createContext, useContext, useState, useEffect } from "react";
import { Friend, FriendStatus, FriendRequest, FriendChat, ChatMessage } from "../types";

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
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: "1",
      username: "Ali_Gamer",
      displayName: "علی گیمر",
      status: FriendStatus.IN_GAME,
      currentGame: "Counter Strike 2",
      level: 42,
      isFavorite: true,
      isBlocked: false,
      isMuted: false,
    },
    {
      id: "2",
      username: "Sina_King",
      displayName: "سینا سلطان",
      status: FriendStatus.IN_LOBBY,
      level: 35,
      isFavorite: false,
      isBlocked: false,
      isMuted: false,
    },
    {
      id: "3",
      username: "Reza_x",
      displayName: "رضا",
      status: FriendStatus.ONLINE,
      level: 28,
      isFavorite: false,
      isBlocked: false,
      isMuted: false,
    },
    {
      id: "4",
      username: "Sara_Player",
      displayName: "سارا پلی‌یر",
      status: FriendStatus.OFFLINE,
      lastSeen: "۳۰ دقیقه پیش",
      level: 31,
      isFavorite: false,
      isBlocked: false,
      isMuted: false,
    },
    {
      id: "5",
      username: "Nima",
      displayName: "نیما",
      status: FriendStatus.OFFLINE,
      lastSeen: "۳ روز پیش",
      level: 15,
      isFavorite: false,
      isBlocked: false,
      isMuted: false,
    }
  ]);

  const [requests, setRequests] = useState<FriendRequest[]>([
    {
      id: "req1",
      userId: "10",
      username: "NeonHunter",
      displayName: "شکارچی نئون",
      level: 42,
      type: "incoming",
      timestamp: "۱۰ دقیقه پیش"
    },
    {
      id: "req2",
      userId: "11",
      username: "ShadowWalker",
      displayName: "سایه رو",
      level: 25,
      type: "outgoing",
      timestamp: "۱ ساعت پیش"
    }
  ]);

  const [chats, setChats] = useState<FriendChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTrigger, setChatTrigger] = useState(0);

  const addFriend = async (username: string) => {
    // Mock API call
    console.log("Sending friend request to:", username);
    setRequests(prev => [...prev, {
      id: Math.random().toString(),
      userId: Math.random().toString(),
      username: username,
      displayName: username,
      level: 1,
      type: "outgoing",
      timestamp: "همین الان"
    }]);
  };

  const acceptRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setFriends(prev => [...prev, {
        id: request.userId,
        username: request.username,
        displayName: request.displayName,
        status: FriendStatus.ONLINE,
        level: request.level,
        isFavorite: false,
        isBlocked: false,
        isMuted: false,
      }]);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const declineRequest = async (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const cancelRequest = async (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const removeFriend = async (friendId: string) => {
    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  const openChat = (friendId: string, displayName?: string) => {
    console.log(`Opening chat for: ${friendId} (${displayName})`);
    setChats(prev => {
      const existingChat = prev.find(c => c.friendId === friendId);
      if (existingChat) {
        // If it exists, update display name if provided and return
        if (displayName && !existingChat.tempDisplayName && !friends.find(f => f.id === friendId)) {
          return prev.map(c => c.friendId === friendId ? { ...c, tempDisplayName: displayName } : c);
        }
        return prev;
      }
      return [...prev, { friendId, messages: [], isTyping: false, unreadCount: 0, tempDisplayName: displayName }];
    });
    setActiveChatId(friendId);
    setChatTrigger(t => t + 1);
  };

  const sendMessage = (friendId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      senderId: "me",
      senderName: "من",
      senderLevel: 10,
      self: true,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    setChats(prev => {
      const existingChat = prev.find(c => c.friendId === friendId);
      if (existingChat) {
        return prev.map(c => c.friendId === friendId 
          ? { ...c, messages: [...c.messages, newMessage] } 
          : c);
      } else {
        return [...prev, { friendId, messages: [newMessage], isTyping: false, unreadCount: 0 }];
      }
    });
    setActiveChatId(friendId);
  };

  const markAsRead = (friendId: string) => {
    setChats(prev => prev.map(c => c.friendId === friendId ? { ...c, unreadCount: 0 } : c));
  };

  const closeChat = (friendId: string) => {
    setChats(prev => prev.filter(c => c.friendId !== friendId));
    if (activeChatId === friendId) setActiveChatId(null);
  };

  const toggleFavorite = (friendId: string) => {
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, isFavorite: !f.isFavorite } : f));
  };

  const toggleBlock = (friendId: string) => {
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, isBlocked: !f.isBlocked } : f));
  };

  const toggleMute = (friendId: string) => {
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, isMuted: !f.isMuted } : f));
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
