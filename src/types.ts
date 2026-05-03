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

export enum BadgeType {
  STREAMER = "streamer",
  PRO = "pro",
  LOBBY_MASTER = "lobby_master",
  VIP = "vip",
  FOUNDER = "founder",
  CHAMPION = "champion",
  PLUS = "plus",
  TOP_PLAYER = "top_player",
  EARLY_USER = "early_user"
}

export enum MembershipType {
  NONE = "none",
  PLUS = "plus",
  VIP = "vip"
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // userIds
}

export interface MessageReply {
  id: string;
  user: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderLevel: number;
  senderColor?: string; // Color based on level
  senderBadges?: BadgeType[];
  text: string;
  timestamp: string;
  isRead: boolean;
  self: boolean;
  replyTo?: MessageReply;
  reactions?: Reaction[];
  mentions?: string[]; // userIds
  gif?: string; // URL
  lobbyInvite?: {
    lobbyId: string;
    gameTitle: string;
    region: string;
    slots: string;
    rank: string;
  };
}

export interface FriendChat {
  friendId: string;
  messages: ChatMessage[];
  isTyping: boolean;
  unreadCount: number;
  tempDisplayName?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: "public" | "game" | "private";
  users: number;
  icon?: string;
}
