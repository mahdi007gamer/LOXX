import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, CornerUpLeft, Save, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

export interface ContextMenuAction {
 id: string;
 label: string;
 icon: React.ReactNode;
 onClick: () => void;
 destructive?: boolean;
}

interface MessageContextMenuProps {
 x: number;
 y: number;
 actions: ContextMenuAction[];
 onClose: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ x, y, actions, onClose }) => {
 const menuRef = useRef<HTMLDivElement>(null);
 const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

 useEffect(() => {
 if (menuRef.current) {
 const rect = menuRef.current.getBoundingClientRect();
 let newX = x;
 let newY = y;

 if (x + rect.width > window.innerWidth) newX = window.innerWidth - rect.width - 10;
 if (y + rect.height > window.innerHeight) newY = window.innerHeight - rect.height - 10;

 if (newX !== x || newY !== y) {
 setAdjustedPosition({ x: newX, y: newY });
 }
 }
 }, [x, y]);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 onClose();
 }
 };
 
 // Slight delay to prevent immediate close if it was opened by a click event that bubbles
 setTimeout(() => {
 window.addEventListener("click", handleClickOutside);
 window.addEventListener("contextmenu", handleClickOutside);
 }, 10);

 return () => {
 window.removeEventListener("click", handleClickOutside);
 window.removeEventListener("contextmenu", handleClickOutside);
 };
 }, [onClose]);

 return createPortal(
 <AnimatePresence>
 <motion.div
 ref={menuRef}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.15 }}
 style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
 className="fixed z-[100000] min-w-[160px] bg-[#0c0c14] border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden py-1 rtl text-right"
 dir="rtl"
 onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
 >
 {actions.map((action) => (
 <button
 key={action.id}
 onClick={(e) => {
 e.stopPropagation();
 e.preventDefault();
 action.onClick();
 onClose();
 }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black transition-colors ${
 action.destructive 
 ? "text-neon-pink hover:bg-neon-pink/10" 
 : "text-gray-300 hover:text-white hover:bg-white/10"
 }`}
 >
 {action.icon}
 {action.label}
 </button>
 ))}
 </motion.div>
 </AnimatePresence>,
 document.body
 );
};
