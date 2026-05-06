import { useEffect } from "react";
import { notifySocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const NotificationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const playNotifySFX = () => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    };

    notifySocket.on("notification", (data: any) => {
      console.log("New notification:", data);
      playNotifySFX();
      
      if (data.type === "LOBBY_INVITE") {
        toast((t) => (
          <div className="flex flex-col gap-3 w-full bg-dark-bg/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 overflow-hidden shrink-0">
                 {data.data?.sender?.avatar ? (
                   <img src={data.data.sender.avatar} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-neon-blue font-bold tracking-tighter">{(data.data?.sender?.username || "A")[0].toUpperCase()}</div>
                 )}
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  <span className="text-neon-blue text-[10px] uppercase font-black tracking-widest">{data.data?.sender?.username}</span>
                  <div className="text-xs text-white/90">شما را به لابی دعوت کرد</div>
                </div>
                <div className="text-[10px] text-white/50 font-medium tracking-tight">لابی {data.data?.lobbyName || "بازی جدید"}</div>
              </div>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => {
                   toast.dismiss(t.id);
                   navigate(`/lobby/${data.data.lobbyId}`);
                }}
                className="flex-1 py-1.5 rounded-xl bg-neon-blue text-black text-[10px] font-black uppercase shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95 transition-all text-center"
               >
                 قبول دعوت
               </button>
               <button 
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 transition-colors text-center border border-white/5"
               >
                 رد کردن
               </button>
            </div>
          </div>
        ), { 
          duration: 10000,
          position: "top-center",
          id: `invite-${data.data?.lobbyId}-${data.data?.sender?.id}`,
          style: {
            background: 'transparent',
            padding: 0,
            boxShadow: 'none',
            border: 'none',
            maxWidth: '320px'
          }
        });
      } else {
        toast(data.message || "اطلاعیه جدید دریافت شد");
      }
    });

    return () => {
      notifySocket.off("notification");
    };
  }, [navigate]);

  return null;
};
