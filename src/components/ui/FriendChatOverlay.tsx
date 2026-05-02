import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { MessageSquare, X, Minus, Send, MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export const FriendChatOverlay = () => {
  const { chats, friends, sendMessage, markAsRead } = useFriends();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  const activeChat = chats.find(c => c.friendId === activeChatId);
  const activeFriend = friends.find(f => f.id === activeChatId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId) return;
    sendMessage(activeChatId, inputMessage.trim());
    setInputMessage("");
  };

  useEffect(() => {
    if (activeChatId) markAsRead(activeChatId);
  }, [activeChatId, activeChat?.messages.length]);

  if (chats.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pb-4 sm:pb-0">
      {/* Active Chats Tabs Container */}
      <div className="flex items-end gap-3 pointer-events-auto px-4 max-w-full overflow-x-auto no-scrollbar pb-2 sm:pb-0">
        {chats.map(chat => {
          const friend = friends.find(f => f.id === chat.friendId);
          if (!friend) return null;
          
          const isActive = activeChatId === friend.id;

          return (
            <div key={chat.friendId} className="relative flex flex-col items-center">
              <AnimatePresence>
                {isActive && !isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute bottom-full mb-4 w-72 sm:w-80 overflow-hidden rounded-2xl bg-[#0a0a0f]/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0"
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-3 text-right" dir="rtl">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                          {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full rounded-full" /> : "👤"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{friend.displayName}</p>
                          <p className="text-[10px] text-green-500">آنلاین</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setIsMinimized(true)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                          <Minus size={16} />
                        </button>
                        <button onClick={() => setActiveChatId(null)} className="p-1.5 text-gray-400 hover:text-neon-pink transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col-reverse bg-gradient-to-b from-transparent to-white/[0.02]">
                       <div className="space-y-4">
                         {chat.messages.map(msg => (
                           <div key={msg.id} className={cn(
                             "flex flex-col gap-1 max-w-[85%]",
                             msg.senderId === "me" ? "mr-auto items-end" : "ml-auto items-start text-right"
                           )} dir={msg.senderId === "me" ? "ltr" : "rtl"}>
                             <div className={cn(
                               "rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-lg",
                               msg.senderId === "me" 
                                 ? "bg-neon-blue text-dark-bg rounded-tr-none font-bold" 
                                 : "bg-white/10 text-gray-200 rounded-tl-none border border-white/10"
                             )}>
                               {msg.text}
                             </div>
                             <span className="text-[8px] text-gray-600 px-1 font-mono">{msg.timestamp}</span>
                           </div>
                         ))}
                         {chat.messages.length === 0 && (
                           <div className="flex h-full flex-col items-center justify-center text-center py-20 opacity-20">
                             <MessageCircle size={40} className="text-gray-400 mb-2" />
                             <p className="text-[10px] text-gray-400">گفتگو را شروع کنید</p>
                           </div>
                         )}
                       </div>
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSend} className="border-t border-white/5 bg-white/5 p-3" dir="rtl">
                      <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/5 p-1 px-2 focus-within:border-neon-blue/50 transition-all">
                        <input 
                          type="text" 
                          placeholder="چیزی بنویسید..."
                          className="flex-1 bg-transparent py-2 text-[11px] text-white focus:outline-none"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                        />
                        <button type="submit" className="p-1.5 text-neon-blue hover:scale-110 transition-transform">
                          <Send size={14} />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Tab Button */}
              <button 
                onClick={() => {
                  if (activeChatId === friend.id) {
                    setIsMinimized(!isMinimized);
                  } else {
                    setActiveChatId(friend.id);
                    setIsMinimized(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-t-2xl px-5 py-3 border-x border-t transition-all duration-300 backdrop-blur-md min-w-[140px] justify-center",
                  isActive && !isMinimized
                    ? "bg-neon-blue text-dark-bg border-neon-blue shadow-[0_-4px_15px_rgba(0,229,255,0.3)] -translate-y-1" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="relative">
                   <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] overflow-hidden">
                     {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full" /> : "👤"}
                   </div>
                   <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-dark-bg" />
                   {chat.unreadCount > 0 && (
                     <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-neon-pink text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                       {chat.unreadCount}
                     </div>
                   )}
                </div>
                <span className="text-[11px] font-black tracking-tight rtl">{friend.displayName}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
