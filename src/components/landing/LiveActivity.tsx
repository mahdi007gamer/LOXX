import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, UserPlus, Sword, Zap } from "lucide-react";

const activities = [
  { id: 1, user: "علی", action: "به لابی CS2 ملحق شد", icon: UserPlus, color: "text-blue-400" },
  { id: 2, user: "سارا", action: "یک پیام جدید فرستاد", icon: MessageSquare, color: "text-pink-400" },
  { id: 3, user: "رضا", action: "مسابقه را شروع کرد", icon: Sword, color: "text-purple-400" },
  { id: 4, user: "مریم", action: "به سطح ۱۰ رسید", icon: Zap, color: "text-yellow-400" },
];

export const LiveActivity = () => {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="font-bold text-white">فعالیت‌های زنده</h4>
        <div className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
      </div>
      
      <div className="space-y-4">
        {activities.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-3 text-sm"
          >
            <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
               <item.icon size={16} />
            </div>
            <div className="text-right">
               <span className="font-bold text-white ml-1">{item.user}</span>
               <span className="text-gray-500">{item.action}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
