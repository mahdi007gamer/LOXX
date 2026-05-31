import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "fa" | "en";

interface TranslationDictionary {
  [key: string]: {
    fa: string;
    en: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation / Sidebar
  dashboard: { fa: "داشبورد", en: "Dashboard" },
  games: { fa: "بازی‌ها", en: "Games" },
  lobbies: { fa: "لابی‌ها", en: "Lobbies" },
  friends: { fa: "دوستان", en: "Friends" },
  globalChat: { fa: "چت سراسری", en: "Global Chat" },
  rankings: { fa: "رتبه‌بندی", en: "Rankings" },
  contactUs: { fa: "ارتباط با ما", en: "Contact Us" },
  premiumClub: { fa: "اشتراک ویژه", en: "Premium VIP" },
  settings: { fa: "تنظیمات", en: "Settings" },
  eliteDashboard: { fa: "داشبورد الیت", en: "Elite Dashboard" },
  windowsSettings: { fa: "تنظیمات ویندوز", en: "Launcher Settings" },
  logout: { fa: "خروج", en: "Log Out" },
  login: { fa: "ورود به حساب", en: "Login" },
  
  // Lobby Room Header / Actions
  lobbyCreated: { fa: "لابی ساخته شد. منتظر همرزمان هستیم...", en: "Lobby created. Waiting for teammates..." },
  lobbyTitle: { fa: "لابی صوتی هوشمند", en: "Smart Voice Lobby" },
  ready: { fa: "آماده", en: "Ready" },
  notReady: { fa: "ناآماده", en: "Not Ready" },
  micStatus: { fa: "میکروفون", en: "Microphone" },
  mute: { fa: "بی‌صدا", en: "Mute" },
  unmute: { fa: "با‌صدا", en: "Unmute" },
  host: { fa: "میزبان", en: "Host" },
  members: { fa: "اعضا", en: "Members" },
  inviteFriends: { fa: "دعوت از دوستان", en: "Invite Friends" },
  leaveLobby: { fa: "خروج از لابی", en: "Leave Lobby" },
  startGame: { fa: "شروع بازی", en: "Start Game" },
  startShare: { fa: "اسکرین شیر", en: "Screen Share" },
  stopShare: { fa: "قطع اسکرین شیر", en: "Stop Screen Share" },
  latency: { fa: "تاخیر (پینگ)", en: "Latency (Ping)" },
  voiceConnection: { fa: "اتصال صوتی", en: "Voice Room" },
  chatAndLobbies: { fa: "چت و پیام‌ها", en: "Chats" },
  
  // Smart Screen Share modal & alerts
  betaShieldTitle: { fa: "کنترلر هوشمند ترافیک اسکرین شیر (نسخه آزمایشی)", en: "Smart Screen Share Traffic Controller (Beta)" },
  betaShieldDesc: { fa: "در کلاینت آزمایشی لوکس، استریم به صورت مستقیم (Direct P2P) هندل می‌شود تا تاخیر به صفر نزدیک شود؛ به همین علت، ترافیک آپلود برای تک‌تک بیننده‌ها مجزا مصرف می‌شود. در نسخه‌های آتی، با راه‌اندازی سرورهای رله اختصاصی (SFU Gateway)، استریم شما تک‌مسیره به سرور فرستاده شده و نامحدود کاربر می‌توانند آن را بدون مصرف پردازش/آپلود بیشتر سیستم شما تماشا کنند.", en: "In LOXX Beta, streams are handled via Direct P2P to achieve ultra-low response. Upload traffic is used per concurrent viewer. In future versions, dedicated Relay Servers (SFU Gateways) will stream single-route so unlimited users can join without extra system cost or upload bounds." },
  realtimeMonitoring: { fa: "پایش بلادرنگ پهنای باند و اتصال", en: "Real-time Bandwidth & Connection Audit" },
  uploadSpeedLabel: { fa: "سرعت آپلود:", en: "Upload Speed:" },
  activeViewersLabel: { fa: "بیننده فعال:", en: "Active Viewers:" },
  lobbyTrafficTotal: { fa: "ترافیک کل لابی:", en: "Lobby Total Traffic:" },
  unsupportableSpeed: { fa: "نامناسب برای اینترنت شما ⚠️", en: "Low Bandwidth ⚠️" },
  viewersOk: { fa: "بیننده اوکیه ✅", en: "viewers supported ✅" },
  startStreamBtn: { fa: "شروع پخش زنده تصویر صفحه", en: "Start Screen Sharing Now" },
  viewLiveStream: { fa: "تماشای پخش زنده تصویر صفحه", en: "Watch Live Screen Share" },
  stopViewStream: { fa: "قطع دریافت ویدیو ❌", en: "Stop Watching ❌" },
  lowUploadAdvice: { fa: "به دلیل سرعت پایین آپلود، این گزینه برای شما خوب نیست!", en: "This quality is unrecommended due to low upload!" },
  stableUploadAdvice: { fa: "پهنای باند کاملاً کافی و استریم فوق پایدار! ✅", en: "Excellent bandwidth & ultra-stable stream! ✅" },
  fps: { fa: "فریم", en: "FPS" },
  planRequirement: { fa: "نیازمند پلن ویژه", en: "Requires Premium Plan" },
  trafficHigh: { fa: "ترافیک بالا", en: "High Load" },
  streamWarningActive: { fa: "پهنای باند آپلود شما کمی ضعیف است. در صورت نیاز کیفیت را کاهش دهید.", en: "Upload bandwidth is limited, reduce quality if needed." },

  // Global Chat UI text alignment & styling elements
  globalChatTitle: { fa: "تالار گفتگوی سراسری لوکس", en: "Loxx Global Lounge" },
  onlineUsers: { fa: "انلاین", en: "Online" },
  typeMessage: { fa: "پیام خود را بنویسید...", en: "Type your message here..." },
  sendBtn: { fa: "ارسال", en: "Send" },
  chatIntro: { fa: "به چت‌روم عمومی لوکس خوش آمدید! با احترام به قوانین جامعه گیمینگ با پلیرها گفت‌وگو کنید.", en: "Welcome to Loxx Lounge! Keep chat clean, sportsmanship matters." },
  gifs: { fa: "گیف‌ها", en: "GIFs" },
  voiceConnectedBtn: { fa: "متصل به ویس لابی", en: "Voice Connected" },
  searchLabel: { fa: "جستجو...", en: "Search..." },
  noAlerts: { fa: "اعلانی برای نمایش وجود ندارد.", en: "No notifications to show." },
  notificationsTitle: { fa: "اعلان‌ها", en: "Notifications" },
  markAllRead: { fa: "خواندن همه", en: "Mark all read" },
  errorNotifications: { fa: "خطا در به روزرسانی اعلان ها", en: "Error updating notifications" },
  congrats: { fa: "تبریک!", en: "Congratulations!" },
  claimReward: { fa: "دریافت جایزه", en: "Claim Reward" },
  newNotification: { fa: "شما یک اعلان جدید دارید.", en: "You have a new notification." },
  weeklyRank: { fa: "رتبه {rank} هفتگی", en: "Weekly Rank {rank}" },

  // Launcher Custom Title Bar / Meta
  betaLabel: { fa: "Beta | آزمایشی", en: "Beta Edition" },
  platformTitle: { fa: "لوکس | اولین پلتفرم پیشرفته گیمینگ فارسی", en: "LOXX | First Persian Advanced Gaming Platform" },
  eliteLauncherTitle: { fa: "نسخه الیت لانچر", en: "ELITE LAUNCHER" },
  
  // Dashboard Metrics
  playTime: { fa: "مدت بازی", en: "Playtime" },
  hours: { fa: "ساعت", en: "Hours" },
  rank: { fa: "رتبه", en: "Rank" },
  xp: { fa: "تجربه", en: "XP" },
  coins: { fa: "سکه لوکس", en: "Loxx Coins" },
  recentMatches: { fa: "بازی‌های اخیر", en: "Recent Matches" },
  playNow: { fa: "شروع بازی کن", en: "Play Now" },
  quickJoinLobby: { fa: "عضویت سریع در لابی‌های فعال", en: "Quick Join Active Lobbies" },
  activeLobbiesCount: { fa: "لابی در حال بازی", en: "Live lobbies running" },
};

interface LanguageContextProps {
  language: Language;
  direction: "rtl" | "ltr";
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("loxx-language") as Language) || "fa";
  });

  const direction = language === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("loxx-language", language);
    // Dynamically apply direction to html element
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "fa" ? "en" : "fa"));
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]["fa"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
