import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const Modal = ({ 
  isOpen = true, 
  title, 
  children, 
  onClose,
  maxWidth = "max-w-lg" 
}: { 
  isOpen?: boolean, 
  title: string, 
  children: React.ReactNode, 
  onClose: () => void,
  maxWidth?: string 
}) => {
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  const topClass = isElectron ? "top-[100px] pt-8" : "top-16 pt-6";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed bottom-0 left-0 right-0 ${topClass} z-[1000] flex items-start justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto pb-12`}
          onClick={onClose}
          dir="rtl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${maxWidth} rounded-3xl bg-dark-card border border-white/10 shadow-2xl flex flex-col mb-10`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-black text-white">{title}</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto no-scrollbar relative flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
