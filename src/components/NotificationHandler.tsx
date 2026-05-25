import { useEffect, useState } from "react";
import { notifySocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { motion } from "motion/react";

const InviteToast = ({ t, inviteData, navigate }: { t: any, inviteData: any, navigate: any }) => {
  const [status, setStatus] = useState<'idle' | 'joining' | 'rejected'>('idle');
  
  const lobbyId = inviteData.lobbyId || inviteData.data?.lobbyId;
  const username = inviteData.fromUsername || inviteData.data?.sender?.username;
  const lobbyName = inviteData.gameTitle || inviteData.data?.lobbyName || "لابی جدید";

  const handleJoin = async () => {
    if (status !== 'idle') return;
    
    setStatus('joining');
    // Dismiss immediately to give immediate feedback
    toast.dismiss(t.id);
    
    try {
      await api.post(`/lobby/${lobbyId}/join`);
      
      const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
      const isOverlayWidget = isElectron && window.location.pathname === '/lobby/overlay-widget';
      
      if (isOverlayWidget && (window as any).electronAPI?.navigateMainWindow) {
        (window as any).electronAPI.navigateMainWindow(`/lobby/${lobbyId}`);
      } else {
        navigate(`/lobby/${lobbyId}`);
      }
      
      toast.success("وارد لابی شدید", { id: 'join-success' });
    } catch (err) {
      toast.error("لابی در دسترس نیست یا بسته شده است");
      setStatus('idle');
    }
  };

  const handleReject = () => {
    setStatus('rejected');
    toast.dismiss(t.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ 
        opacity: t.visible ? 1 : 0, 
        y: t.visible ? 0 : 40, 
        scale: t.visible ? 1 : 0.95,
      }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300,
        opacity: { duration: 0.15 }
      }}
      className="modern-glass-toast relative flex flex-col gap-5 w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] min-w-[280px] sm:min-w-[360px] shrink-0 p-6 bg-[#0d0d14]/80 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden group" 
      dir="rtl"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/60 to-transparent" />
      
      {/* Glow Effect */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-neon-pink/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-neon-blue/15 transition-colors duration-500" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 overflow-hidden shrink-0 shadow-[0_0_25px_rgba(0,229,255,0.15)] ring-1 ring-white/5">
          <div className="text-neon-blue font-black text-xl tracking-tighter">{(username || "A")[0].toUpperCase()}</div>
        </div>
        <div className="flex-1 text-right">
          <div className="flex flex-col">
            <span className="text-neon-blue text-[10px] uppercase font-black tracking-[0.2em] mb-1">{username}</span>
            <div className="text-sm font-bold text-white/95 leading-tight">شما را به لابی دعوت کرد</div>
          </div>
          <div className="text-[11px] text-white/40 font-medium tracking-tight mt-1 bg-white/5 w-fit px-2 py-0.5 rounded-full border border-white/5">
            {lobbyName}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-1 relative z-10">
         <button 
          disabled={status !== 'idle'}
          onClick={handleJoin}
          className="flex-1 py-3.5 rounded-2xl bg-neon-blue text-dark-bg text-[11px] font-black uppercase tracking-widest shadow-[0_8px_25px_rgba(0,229,255,0.35)] hover:shadow-[0_12px_35px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
         >
           {status === 'joining' ? (
             <div className="w-4 h-4 border-2 border-dark-bg/30 border-t-dark-bg rounded-full animate-spin" />
           ) : "قبول دعوت"}
         </button>
         <button 
          disabled={status !== 'idle'}
          onClick={handleReject}
          className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white/90 border border-white/10 transition-all duration-300 cursor-pointer disabled:opacity-50"
         >
           رد کردن
         </button>
      </div>
    </motion.div>
  );
};

export const NotificationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const playNotifySFX = () => {
      // Disabled mixkit sound
    };

    const handleLobbyInvite = (inviteData: any) => {
      playNotifySFX();
      
      const lobbyId = inviteData.lobbyId || inviteData.data?.lobbyId;
      const senderId = inviteData.fromId || inviteData.data?.sender?.id;

      toast.custom((t) => (
        <InviteToast t={t} inviteData={inviteData} navigate={navigate} />
      ), { 
        duration: 15000,
        position: "bottom-right",
        id: `invite-${lobbyId}-${senderId}`,
      });
    };

    const handleWarning = (data: any) => {
      toast.error(data.message, { 
        duration: 10000, 
        icon: '⚠️',
        style: {
          borderRadius: '16px',
          background: '#1a0505',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontWeight: '900',
          padding: '16px',
        }
      });
    };

    notifySocket.on("lobby.invite", handleLobbyInvite);
    notifySocket.on("moderation.warning", handleWarning);
    notifySocket.on("notification", (data: any) => {
      if (data.type === "LOBBY_INVITE") {
        handleLobbyInvite(data);
      } else {
        playNotifySFX();
        toast(data.message || "اطلاعیه جدید دریافت شد");
      }
    });

    return () => {
      notifySocket.off("lobby.invite");
      notifySocket.off("moderation.warning");
      notifySocket.off("notification");
    };
  }, [navigate]);

  return null;
};
