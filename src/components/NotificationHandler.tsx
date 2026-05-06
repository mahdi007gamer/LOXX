import { useEffect } from "react";
import { notifySocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export const NotificationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const playNotifySFX = () => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    };

    const handleLobbyInvite = (inviteData: any) => {
      console.log("New lobby invite:", inviteData);
      playNotifySFX();
      
      // Normalize data structure if it comes from the direct lobby.invite event
      const lobbyId = inviteData.lobbyId || inviteData.data?.lobbyId;
      const username = inviteData.fromUsername || inviteData.data?.sender?.username;
      const lobbyName = inviteData.gameTitle || inviteData.data?.lobbyName || "لابی جدید";
      const senderId = inviteData.fromId || inviteData.data?.sender?.id;

      toast.custom((t) => (
        <div 
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} modern-glass-toast relative flex flex-col gap-5 w-[360px] p-6 bg-[#0d0d14]/70 backdrop-blur-2xl rounded-[28px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden group`} 
          dir="rtl"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/60 to-transparent" />
          
          {/* Glow Effect */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-neon-pink/15 rounded-full blur-[60px] pointer-events-none group-hover:bg-neon-blue/20 transition-colors duration-500" />

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
              onClick={async () => {
                 toast.dismiss(t.id);
                 try {
                   await api.post(`/lobby/${lobbyId}/join`);
                   toast.success("وارد لابی شدید");
                   navigate(`/lobby/${lobbyId}`);
                 } catch (err) {
                   toast.error("لابی در دسترس نیست یا بسته شده است");
                 }
              }}
              className="flex-1 py-3.5 rounded-2xl bg-neon-blue text-dark-bg text-[11px] font-black uppercase tracking-widest shadow-[0_8px_25px_rgba(0,229,255,0.35)] hover:shadow-[0_12px_35px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer"
             >
               قبول دعوت
             </button>
             <button 
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white/90 border border-white/10 transition-all duration-300 cursor-pointer"
             >
               رد کردن
             </button>
          </div>
        </div>
      ), { 
        duration: 15000,
        position: "bottom-left",
        id: `invite-${lobbyId}-${senderId}`,
      });
    };

    notifySocket.on("lobby.invite", handleLobbyInvite);
    notifySocket.on("notification", (data: any) => {
      console.log("New notification:", data);
      if (data.type === "LOBBY_INVITE") {
        handleLobbyInvite(data);
      } else {
        playNotifySFX();
        toast(data.message || "اطلاعیه جدید دریافت شد");
      }
    });

    return () => {
      notifySocket.off("lobby.invite");
      notifySocket.off("notification");
    };
  }, [navigate]);

  return null;
};
