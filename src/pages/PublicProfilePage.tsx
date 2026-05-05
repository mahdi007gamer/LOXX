import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { User, Shield } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { toast } from "react-hot-toast";

export const PublicProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/user/${username}`);
        setProfile(response.data.data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchProfile();
  }, [username]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-neon-blue">درحال بارگذاری...</div>;
  }

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 px-4 py-8 md:mr-64 flex flex-col items-center justify-center">
          <Shield size={64} className="text-red-500 mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-gray-300">کاربر یافت نشد</h2>
          <button onClick={() => navigate(-1)} className="mt-4 text-neon-blue text-sm">بازگشت</button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-white/[0.02] border border-white/10">
            <div className="h-48 w-full bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10" />
            
            <div className="px-8 pb-8">
              <div className="relative -mt-16 flex flex-col items-start gap-6 sm:flex-row">
                <div className="relative group mx-auto sm:mx-0">
                  <div className="h-32 w-32 rounded-3xl border-4 border-dark-bg bg-dark-card shadow-2xl overflow-hidden">
                    <div className="flex h-full w-full items-center justify-center bg-neon-blue/20 text-neon-blue">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.username} className="h-full w-full object-cover" /> : <User size={64} />}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 mt-4 sm:mt-16 text-center sm:text-right w-full">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-2xl font-black text-white">{profile.displayName || profile.username}</h1>
                    {profile.membership !== "NONE" && (
                      <span className="rounded-md bg-neon-purple/20 px-2 py-0.5 text-[10px] font-bold text-neon-purple border border-neon-purple/30">
                        {profile.membership}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 font-mono">@{profile.username}</p>
                </div>
                
                <div className="w-full sm:w-auto flex justify-center sm:mt-16 mt-4">
                  <GlowButton onClick={() => {
                      api.post("/friends/request", { username: profile.username })
                        .then(() => toast.success("درخواست دوستی ارسال شد"))
                        .catch((err) => toast.error(err.response?.data?.error?.message || "خطا در ارسال درخواست"));
                  }}>ارسال درخواست دوستی</GlowButton>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <NeonCard className="p-6">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-gray-500 mb-1">سطح کاربر</div>
                  <div className="text-3xl font-black text-neon-blue">{profile.level || 1}</div>
                </div>
              </NeonCard>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              {/* Bio section */}
              <NeonCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">درباره کاربر</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.bio || "بیوگرافی تنظیم نشده است."}
                </p>
              </NeonCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
