import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { MessageSquare, X, Minus, Send, MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export const FriendChatOverlay = () => {
  const { chats, friends, sendMessage, markAsRead, closeChat } = useFriends();
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
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none px-4">
      {/* Active Chat Window */}
      <AnimatePresence>
        {activeChatId && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-2 w-full max-w-[320px] sm:max-w-[350px] overflow-hidden rounded-2xl bg-[#0a0a0f]/98 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50 pointer-events-auto"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3 text-right" dir="rtl">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm overflow-hidden">
                  {activeFriend?.avatar ? <img src={activeFriend.avatar} alt="" className="h-full w-full rounded-full" /> : "👤"}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{activeFriend?.displayName}</p>
                  <p className="text-[10px] text-green-500">آنلاین</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(true)} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="کوچک کردن">
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => {
                    closeChat(activeChatId);
                    setActiveChatId(null);
                  }} 
                  className="p-1.5 text-gray-400 hover:text-neon-pink transition-colors"
                  title="بستن گفتگو"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 flex flex-col-reverse bg-gradient-to-b from-transparent to-white/[0.02] no-scrollbar">
               <div className="space-y-4">
                 {activeChat?.messages.map(msg => (
                   <div key={msg.id} className={cn(
                     "flex flex-col gap-1 max-w-[85%]",
                     msg.senderId === "me" ? "mr-auto items-end" : "ml-auto items-start text-right"
                   )} dir={msg.senderId === "me" ? "ltr" : "rtl"}>
                     <div className={cn(
                       "rounded-2xl px-3 py-2 text-[11px] font-medium leading-relaxed shadow-lg",
                       msg.senderId === "me" 
                         ? "bg-neon-blue text-dark-bg rounded-tr-none" 
                         : "bg-white/10 text-gray-200 rounded-tl-none border border-white/10"
                     )}>
                       {msg.text}
                     </div>
                     <span className="text-[8px] text-gray-600 px-1 font-mono">{msg.timestamp}</span>
                   </div>
                 ))}
                 {activeChat?.messages.length === 0 && (
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
                  className="flex-1 bg-transparent py-2 text-[11px] text-white focus:outline-none placeholder:text-gray-600"
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

      {/* Active Chats Tabs Container */}
      <div className="flex items-end gap-2 pointer-events-auto px-4 max-w-full pb-0 overflow-x-visible">
        {chats.map(chat => {
          const friend = friends.find(f => f.id === chat.friendId);
          if (!friend) return null;
          
          const isActive = activeChatId === friend.id;

          return (
            <div key={chat.friendId} className="relative group/tab flex items-center">
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
                  "flex items-center gap-2.5 rounded-t-2xl pl-10 pr-4 py-2.5 border-x border-t transition-all duration-300 backdrop-blur-md min-w-[120px] max-w-[180px] justify-center relative select-none",
                  isActive && !isMinimized
                    ? "bg-neon-blue text-dark-bg border-neon-blue shadow-[0_-4px_15px_rgba(0,229,255,0.3)] -translate-y-1" 
                    : "bg-[#0a0a0f]/90 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="relative shrink-0">
                   <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] overflow-hidden">
                     {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full" /> : "👤"}
                   </div>
                   <div className={cn(
                     "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-dark-bg",
                     friend.status === FriendStatus.ONLINE ? "bg-green-500" : "bg-gray-500"
                   )} />
                   {chat.unreadCount > 0 && (
                     <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-neon-pink text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                       {chat.unreadCount}
                     </div>
                   )}
                </div>
                <span className="text-[11px] font-black tracking-tight truncate overflow-hidden whitespace-nowrap">{friend.displayName}</span>
              </button>
              
              {/* Close Button on Tab */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat(friend.id);
                  if (activeChatId === friend.id) setActiveChatId(null);
                }}
                className={cn(
                  "absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/20 opacity-0 group-hover/tab:opacity-100 hover:bg-neon-pink hover:text-neon-pink transition-all z-10",
                  isActive && !isMinimized ? "text-dark-bg/60 hover:text-neon-pink" : "text-gray-500"
                )}
                title="بستن"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
