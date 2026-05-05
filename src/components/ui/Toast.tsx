import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast = ({ message, isVisible, onClose }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-8 left-1/2 z-[20000] -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-bg/80 px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-blue/20 text-neon-blue">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-sm font-medium text-white">{message}</p>
            <button 
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 h-0.5 bg-neon-blue rounded-full animate-[progress_4s_linear]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
