export enum FriendStatus {
  ONLINE = "online",
  IN_GAME = "in_game",
  IN_LOBBY = "in_lobby",
  OFFLINE = "offline"
}

export interface Lobby {
  id: number;
  game: string;
  title: string;
  players: number;
  max: number;
  rank: string;
  icon: string;
  variant: "blue" | "pink" | "purple";
  region: string;
  mode: string;
  createdAt: string;
  status: "hot" | "new" | "normal";
  gameBanner?: string;
  isPrivate?: boolean;
  micRequired?: boolean;
  discordRequired?: boolean;
  isAgeRestricted?: boolean;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  image: string;
  activeLobbies: number;
  playerCount: string;
  friendsPlaying: string[]; 
  isFavorite?: boolean;
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
