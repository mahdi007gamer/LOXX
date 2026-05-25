import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, UserPlus, Sword, Zap, Gamepad2 } from "lucide-react";
import { publicSocket } from "../../lib/socket";

type ActivityAction = 'LOBBY_CREATE' | 'LOBBY_JOIN' | 'CHAT_MESSAGE' | 'LEVEL_UP';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  type: ActivityAction;
  timestamp: number;
}

const initialActivities: ActivityItem[] = [
  { id: "1", user: "محسن", action: "به لابی CS2 ملحق شد", type: 'LOBBY_JOIN', timestamp: Date.now() - 5000 },
  { id: "2", user: "امیرحسین", action: "یک پیام جدید در چت سراسری فرستاد", type: 'CHAT_MESSAGE', timestamp: Date.now() - 15000 },
  { id: "3", user: "Ghost", action: "مسابقه را در Dota 2 شروع کرد", type: 'LOBBY_CREATE', timestamp: Date.now() - 25000 },
  { id: "4", user: "مریم", action: "به سطح ۱۰ رسید", type: 'LEVEL_UP', timestamp: Date.now() - 40000 },
];

const mockNames = ["علیرضا", "Phantom", "سارا", "DarkKnight", "Nima", "PersianGod", "زهرا", "CyberKing"];
const mockGames = ["CS2", "Dota 2", "Valorant", "Rainbow Six"];

export const LiveActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);

  useEffect(() => {
    publicSocket.connect();

    const handleNewActivity = (data: any) => {
      setActivities(prev => {
        const newArr = [{ ...data, timestamp: Date.now() }, ...prev];
        return newArr.slice(0, 4); // Keep last 4
      });
    };

    publicSocket.on("public.activity", handleNewActivity);

    // To ensure dynamism even when no users are online, we inject a mock activity every 8-15 seconds
    const interval = setInterval(() => {
      const types: ActivityAction[] = ['LOBBY_CREATE', 'LOBBY_JOIN', 'CHAT_MESSAGE', 'LEVEL_UP'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      
      let actionText = "";
      if (randomType === 'LOBBY_CREATE') actionText = `لابی جدیدی برای ${mockGames[Math.floor(Math.random() * mockGames.length)]} ساخت`;
      else if (randomType === 'LOBBY_JOIN') actionText = `به لابی ${mockGames[Math.floor(Math.random() * mockGames.length)]} ملحق شد`;
      else if (randomType === 'CHAT_MESSAGE') actionText = "پیامی در چت سراسری ارسال کرد";
      else if (randomType === 'LEVEL_UP') actionText = `به سطح ${Math.floor(Math.random() * 20) + 2} ارتقا یافت`;

      handleNewActivity({
        id: `mock-${Date.now()}-${Math.random()}`,
        user: randomName,
        action: actionText,
        type: randomType
      });
    }, 12000);

    return () => {
      publicSocket.off("public.activity", handleNewActivity);
      clearInterval(interval);
    };
  }, []);

  const getIcon = (type: ActivityAction) => {
    switch(type) {
      case 'LOBBY_JOIN': return { icon: UserPlus, color: "text-blue-400" };
      case 'CHAT_MESSAGE': return { icon: MessageSquare, color: "text-pink-400" };
      case 'LOBBY_CREATE': return { icon: Gamepad2, color: "text-green-400" };
      case 'LEVEL_UP': return { icon: Zap, color: "text-yellow-400" };
      default: return { icon: Sword, color: "text-purple-400" };
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-md overflow-hidden relative">
      <div className="mb-6 flex items-center justify-between relative z-10">
        <h4 className="font-bold text-white">فعالیت‌های زنده پلتفرم</h4>
        <div className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_red]" />
      </div>
      
      <div className="space-y-3 relative z-10">
        <AnimatePresence initial={false}>
          {activities.map((item) => {
            const { icon: Icon, color } = getIcon(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-3 text-sm hover:bg-white/10 transition-colors"
              >
                <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                   <Icon size={16} />
                </div>
                <div className="text-right flex-1 truncate">
                   <span className="font-bold text-white ml-2">{item.user}</span>
                   <span className="text-gray-400">{item.action}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
