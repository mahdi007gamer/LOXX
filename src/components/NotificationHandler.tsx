import { useEffect } from "react";
import { notifySocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const NotificationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    notifySocket.on("notification", (data: any) => {
      console.log("New notification:", data);
      
      if (data.type === "LOBBY_INVITE") {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span className="font-bold">دعوت به لابی</span>
            <span className="text-xs">شما به یک لابی دعوت شده‌اید.</span>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate(`/lobby/${data.data.lobbyId}`);
                }}
                className="bg-neon-blue text-dark-bg px-3 py-1 rounded-md text-xs font-black uppercase"
              >
                Join
              </button>
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="bg-white/10 text-white px-3 py-1 rounded-md text-xs font-black uppercase"
              >
                Decline
              </button>
            </div>
          </div>
        ), { duration: 10000 });
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
