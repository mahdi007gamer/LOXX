export enum FriendStatus {
  ONLINE = "online",
  IN_GAME = "in_game",
  IN_LOBBY = "in_lobby",
  OFFLINE = "offline"
}

export interface LobbyMember {
  userId: string;
  username: string;
  role: "HOST" | "PLAYER" | "SPECTATOR";
  isReady: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  level?: number;
  membership?: MembershipType;
  badges?: Badge[];
}

export interface Lobby {
  id: string;
  gameId: string;
  gameTitle?: string;
  title: string;
  hostId: string;
  maxPlayers: number;
  status: "WAITING" | "STARTING" | "IN_PROGRESS" | "FINISHED";
  region: string;
  players: LobbyMember[];
  mode?: string;
  selectedMaps?: string[];
  description?: string;
  skillLevel?: string;
  micRequired?: boolean;
  isPrivate?: boolean;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  image: string;
  iconUrl?: string; // Admin uploaded icon
  bannerUrl?: string;
  metadata?: string; // JSON string for features, regions, etc.
  variants?: string[];
  maps?: string[];
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
  avatarUrl?: string;
  status: FriendStatus;
  currentGame?: string;
  lastSeen?: string;
  level: number;
  membership?: MembershipType;
  vipMetadata?: any;
  bannerUrl?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  isMuted: boolean;
  badges?: Badge[];
}

export interface FriendRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarUrl?: string;
  level: number;
  type: "incoming" | "outgoing";
  timestamp: string;
  membership?: MembershipType;
  vipMetadata?: any;
  bannerUrl?: string;
  badges?: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  iconUrl: string;
  category: "STANDARD" | "GAME" | "SPECIAL";
  isSpecial: boolean;
  isPinned?: boolean;
  earnedAt?: string;
}

export enum BadgeType {
  STREAMER = "Streamer",
  PRO = "Pro Player",
  LOBBY_MASTER = "Lobby Master",
  VIP = "VIP",
  FOUNDER = "Founder",
  CHAMPION = "Champion",
  PLUS = "Plus",
  TOP_PLAYER = "Top Player",
  EARLY_USER = "Early User"
}

export enum MembershipType {
  NONE = "NONE",
  PLUS = "PLUS",
  VIP = "VIP"
}

export interface VIPMetadata {
  auraEffect: boolean;
  shinyName: boolean;
  specialFrame: boolean;
  fullGlow: boolean;
  frame: string;
  frameColor: string;
  effectType: string;
  opacity: number;
  bgImage?: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
    statsText?: string;
    statsLabel?: string;
    badgeText?: string;
    textGradient?: string;
    gradient?: {
      enabled: boolean;
      color1: string;
      color2: string;
      type: "linear" | "radial" | "conic";
      angle: number;
    };
  };
  chatStyle?: {
    bubbleColor: string;
    textColor: string;
    effect?: string;
  };
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
  avatarUrl?: string; // fallback
  isOnline?: boolean;
  senderLevel: number;
  senderColor?: string; // Color based on level
  senderBadges?: (Badge | BadgeType)[];
  badges?: (Badge | BadgeType)[];
  text: string;
  timestamp: string;
  isRead: boolean;
  self: boolean;
  replyTo?: MessageReply;
  reactions?: Reaction[];
  mentions?: string[]; // userIds
  gif?: string; // URL
  image?: string; // URL
  bannerUrl?: string;
  vipMetadata?: any;
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
  tempAvatarUrl?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: "public" | "game" | "private";
  users: number;
  icon?: string;
}
