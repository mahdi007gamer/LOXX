import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { motion } from "motion/react";
import { Users, AlertTriangle } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import StreamerProposalPage from "./StreamerProposalPage";

export const InviteRedirectPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isStreamerInvite, setIsStreamerInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleJoin = async () => {
      if (!code) {
        setError("لینک دعوت نامعتبر است");
        setLoading(false);
        return;
      }

      // 1. Try to check if it's a streamer proposal page (publicly accessible)
      try {
        const streamerRes = await api.get(`/streamers/invite/${code}`);
        if (streamerRes.data && streamerRes.data.status === "success" && streamerRes.data.data) {
          setIsStreamerInvite(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Not a streamer invite, proceed to standard elite group invitation handling
      }

      // 2. Elite group invite requires authentication
      if (!user) {
        // save the code to localStorage so we can join after login
        localStorage.setItem("pending_invite_code", code || "");
        navigate("/auth");
        return;
      }

      try {
        const res = await api.post("/elite/join-link", { inviteCode: code });
        navigate("/chat?channel=" + res.data.data.groupId);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "مشکلی در پیوستن به گروه پیش آمد");
      } finally {
        setLoading(false);
      }
    };
    handleJoin();
  }, [code, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
         <div className="h-10 w-10 border-4 border-t-neon-blue border-white/10 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the streamer proposal page dynamically if verified
  if (isStreamerInvite && code) {
    return <StreamerProposalPage overrideName={code} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b0c10] border border-red-500/20 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center"
        >
           <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
             <AlertTriangle size={40} />
           </div>
           <h2 className="text-xl font-black text-white mb-2">لینک نامعتبر</h2>
           <p className="text-sm text-gray-400 font-bold mb-8">{error}</p>
           <GlowButton onClick={() => navigate("/chat")} className="w-full">بازگشت به چت</GlowButton>
        </motion.div>
      </div>
    );
  }

  return null;
};
