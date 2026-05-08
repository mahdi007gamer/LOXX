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
  avatarUrl?: string; // fallback
  isOnline?: boolean;
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
}

export interface Channel {
  id: string;
  name: string;
  type: "public" | "game" | "private";
  users: number;
  icon?: string;
}
