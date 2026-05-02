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
    <div className="fixed bottom-0 left-8 z-[100] flex items-end gap-2 pointer-events-none">
      {/* Active Chats Tabs */}
      <div className="flex items-end gap-2 pointer-events-auto">
        {chats.map(chat => {
          const friend = friends.find(f => f.id === chat.friendId);
          if (!friend) return null;
          
          const isActive = activeChatId === friend.id;

          return (
            <div key={chat.friendId} className="relative flex flex-col items-end">
              <AnimatePresence>
                {isActive && !isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="mb-2 w-80 overflow-hidden rounded-2xl bg-[#0a0a0f]/95 border border-white/10 shadow-2xl backdrop-blur-xl"
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm">👤</div>
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
                    <div className="h-80 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col-reverse">
                       <div className="space-y-4">
                         {chat.messages.map(msg => (
                           <div key={msg.id} className={cn(
                             "flex flex-col gap-1 max-w-[80%]",
                             msg.senderId === "me" ? "mr-auto items-end" : "ml-auto items-start"
                           )}>
                             <div className={cn(
                               "rounded-2xl px-3 py-2 text-xs leading-relaxed",
                               msg.senderId === "me" 
                                 ? "bg-neon-blue/20 text-white rounded-tr-none border border-neon-blue/20" 
                                 : "bg-white/5 text-gray-300 rounded-tl-none border border-white/10"
                             )}>
                               {msg.text}
                             </div>
                             <span className="text-[9px] text-gray-600 px-1">{msg.timestamp}</span>
                           </div>
                         ))}
                         {chat.messages.length === 0 && (
                           <div className="flex h-full flex-col items-center justify-center text-center py-20">
                             <MessageSquare size={32} className="text-gray-800 mb-2" />
                             <p className="text-[10px] text-gray-600">هنوز پیامی ارسال نشده است</p>
                           </div>
                         )}
                       </div>
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSend} className="border-t border-white/5 bg-white/5 p-3">
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
                  "flex items-center gap-3 rounded-t-xl px-4 py-2 border-x border-t transition-all duration-300 backdrop-blur-md",
                  isActive 
                    ? "bg-neon-blue/10 border-neon-blue/30 text-neon-blue" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                )}
              >
                <div className="relative">
                   <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">👤</div>
                   {chat.unreadCount > 0 && (
                     <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-neon-pink text-[8px] text-white flex items-center justify-center font-bold">
                       {chat.unreadCount}
                     </div>
                   )}
                </div>
                <span className="text-[10px] font-black tracking-tight">{friend.displayName}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
