export enum FriendStatus {
  ONLINE = "online",
  IN_GAME = "in_game",
  IN_LOBBY = "in_lobby",
  OFFLINE = "offline"
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: FriendStatus;
  currentGame?: string;
  lastSeen?: string;
  level: number;
  isFavorite: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}

export interface FriendRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  type: "incoming" | "outgoing";
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface FriendChat {
  friendId: string;
  messages: ChatMessage[];
  isTyping: boolean;
  unreadCount: number;
}
