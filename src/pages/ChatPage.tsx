import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Send, Hash, Users, MoreVertical, Plus, Smile } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_MESSAGES = [
  { id: 1, user: "مازیار", text: "سلام بچه‌ها! کسی پایه هست بریم CS2؟", time: "۱۲:۳۰", self: false },
  { id: 2, user: "امیر", text: "من هستم، لابی بساز جوین شیم.", time: "۱۲:۳۱", self: false },
  { id: 3, user: "خودم", text: "منم میام، فقط پینگ چطوره؟", time: "۱۲:۳۲", self: true },
  { id: 4, user: "مازیار", text: "پینگ عالیه، زیر ۵۰ هست.", time: "۱۲:۳۳", self: false },
  { id: 5, user: "امیر", text: "اوکی، من لابی رو زدم. بیاین.", time: "۱۲:۳۴", self: false },
];

export const ChatPage = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now(),
      user: "خودم",
      text: input,
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      self: true,
    };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <Sidebar />
      
      {/* Channels Sidebar (Inner) */}
      <div className="hidden w-72 border-l border-white/10 bg-dark-bg/30 backdrop-blur-md lg:block md:mr-64 shadow-xl">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-black text-white">اتاق‌های گفتگو</h2>
          <button className="text-neon-blue hover:scale-110 transition-transform">
            <Plus size={20} />
          </button>
        </div>
        
        <div className="space-y-1 px-4">
          {[
            { name: "چت عمومی", active: true, users: 124 },
            { name: "اخبار گیمینگ", active: false, users: 45 },
            { name: "پیدا کردن یار", active: false, users: 89 },
            { name: "گپ آزاد", active: false, users: 12 },
          ].map((channel, i) => (
            <button
              key={i}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all",
                channel.active ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Hash size={18} />
                <span className="font-medium">{channel.name}</span>
              </div>
              <span className="text-[10px] opacity-60">{channel.users} آنلاین</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="relative flex flex-1 flex-col bg-white/[0.02]">
        {/* Chat Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue">
              <Hash size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">چت عمومی</h3>
              <p className="text-xs text-green-500">۱۲۴ نفر آنلاین</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-white transition-colors"><Users size={20} /></button>
            <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
          </div>
        </header>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex flex-col gap-1 max-w-[80%]",
                msg.self ? "mr-auto items-end" : "ml-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-gray-500">{msg.time}</span>
                <span className={cn("text-xs font-bold", msg.self ? "text-neon-pink" : "text-neon-blue")}>
                  {msg.user}
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm shadow-lg",
                  msg.self 
                    ? "bg-neon-pink/10 text-white border border-neon-pink/20 rounded-tr-none" 
                    : "bg-white/5 text-white border border-white/10 rounded-tl-none"
                )}
              >
                {msg.text}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className="relative flex items-center">
            <div className="absolute right-4 flex items-center gap-2 text-gray-500">
              <button className="hover:text-neon-blue transition-colors"><Plus size={20} /></button>
              <button className="hover:text-neon-blue transition-colors"><Smile size={20} /></button>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="پیام خود را بنویسید..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-16 pr-16 text-white shadow-2xl backdrop-blur-xl focus:border-neon-blue/50 focus:outline-none transition-all"
            />
            <div className="absolute left-2">
              <GlowButton 
                variant="blue" 
                size="sm" 
                className="h-10 w-10 !rounded-xl !p-0"
                onClick={handleSend}
              >
                <Send size={18} className="translate-x-[-1px] rotate-180" />
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
