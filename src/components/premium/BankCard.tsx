import React from "react";
import { motion } from "motion/react";
import { CreditCard, Wifi } from "lucide-react";

interface BankCardProps {
  cardNumber: string;
  cardHolder: string;
}

export const BankCard: React.FC<BankCardProps> = ({ cardNumber, cardHolder }) => {
  return (
    <motion.div 
      initial={{ rotateY: -20, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      className="relative w-full max-w-sm aspect-[1.6/1] rounded-3xl p-8 overflow-hidden group perspective-1000"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl" />
      
      {/* Decorative Glows */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-blue/20 rounded-full blur-[60px] animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-purple/20 rounded-full blur-[60px] animate-pulse delay-700" />
      
      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col justify-between text-white">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest italic">Bank Account</p>
            <h3 className="font-black italic text-lg tracking-tighter">LOXX PREMIUM</h3>
          </div>
          <Wifi className="rotate-90 opacity-40 shrink-0" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-9 bg-yellow-500/20 rounded-lg border border-yellow-500/30 relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent" />
               <div className="grid grid-cols-3 h-full opacity-20">
                  <div className="border-r border-yellow-500" />
                  <div className="border-r border-yellow-500" />
               </div>
            </div>
            <p className="text-lg md:text-2xl font-mono tracking-[0.15em] font-bold text-shadow-glow truncate">
              {cardNumber}
            </p>
          </div>

          <div className="flex justify-between items-end">
            <div className="min-w-0 pr-4">
              <p className="text-[8px] font-black uppercase opacity-60 tracking-widest italic">Card Holder</p>
              <p className="font-black italic text-xs md:text-base uppercase tracking-tight truncate">مهدی دلال زاده احمدی</p>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0">
               <CreditCard size={20} className="text-white/60" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
