import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/layout/Sidebar";
import { Shield, ArrowRight, Save, Edit3, X } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { NeonCard } from "../components/ui/NeonCard";
import { AuthorizedImage } from "../components/ui/AuthorizedImage";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

const StreamerEditForm = ({ s, onSuccess, onCancel }: { s: any, onSuccess: () => void, onCancel: () => void }) => {
  const [discountCode, setDiscountCode] = useState(s.discountCode || "");
  const [userDiscountPercent, setUserDiscountPercent] = useState(s.userDiscountPercent || 0);
  const [commissionPercent, setCommissionPercent] = useState(s.streamerCommissionPercent || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch(`/admin/streamers/${s.id}`, {
        discountCode,
        userDiscountPercent: parseFloat(userDiscountPercent.toString()),
        streamerCommissionPercent: parseFloat(commissionPercent.toString())
      });
      toast.success("اطلاعات استریمر با موفقیت بروزرسانی شد");
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا در بروزرسانی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/50 p-4 border border-neon-purple/30 rounded-2xl space-y-4">
      <div className="flex justify-between items-center mb-2">
         <span className="text-xs font-black text-neon-purple">ویرایش تنظیمات استریمر</span>
         <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
         </button>
      </div>

      <div className="space-y-3">
        <div>
           <label className="text-[10px] text-gray-400 mb-1 block">کد تخفیف اختصاصی</label>
           <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs" dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
             <label className="text-[10px] text-gray-400 mb-1 block">تخفیف کاربر (%)</label>
             <input type="number" value={userDiscountPercent} onChange={(e) => setUserDiscountPercent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs" dir="ltr" />
          </div>
          <div>
             <label className="text-[10px] text-gray-400 mb-1 block">سهم استریمر (%)</label>
             <input type="number" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs" dir="ltr" />
          </div>
        </div>
      </div>
      
      <GlowButton variant="purple" onClick={handleSave} className="w-full text-xs py-2" disabled={loading}>
        <Save size={14} className="mr-2" />
        ذخیره تغییرات
      </GlowButton>
    </div>
  );
};

export const AdminStreamersPage = () => {
  const { user, isSidebarCollapsed } = useAuth();
  const navigate = useNavigate();
  const [streamers, setStreamers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"streamers" | "invites">("streamers");
  const [editingStreamerId, setEditingStreamerId] = useState<string | null>(null);
  
  // invite form
  const [alias, setAlias] = useState("");
  const [streamerName, setStreamerName] = useState("");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchStreamers();
      fetchInvites();
    }
  }, [user]);

  const fetchStreamers = async () => {
    try {
      const res = await api.get(`/admin/streamers`);
      setStreamers(res.data.data || []);
    } catch {
      toast.error("خطا در دریافت لیست استریمرها");
    }
  };
  
  const fetchInvites = async () => {
    try {
      const res = await api.get(`/admin/streamer-invites`);
      setInvites(res.data.data || []);
    } catch {
      toast.error("خطا در دریافت صفحات دعوت");
    }
  };
  
  const uploadVoice = async (file: File) => {
    // Client-side guard for large audio files to prevent 413 Payload Too Large
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      toast.error(`حجم فایل بسیار زیاد است (${(file.size / (1024 * 1024)).toFixed(1)}MB). به عنوان مدیر پلتفرم، حداکثر حجم مجاز آپلود برای فایل‌های صوتی ۱۰ مگابایت است. لطفاً فایل فشرده‌تری انتخاب نمایید.`);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await api.post("/upload/audio", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setVoiceUrl(res.data.url);
        toast.success("وویس با موفقیت آپلود شد");
    } catch (e: any) {
        console.error("Audio upload error:", e);
        if (e.response?.status === 413) {
            toast.error("خطای بارگذاری: حجم فایل صوتی انتخابی بیش از حد مجاز شبکه سرور است (بیشتر از ۱۰ مگابایت).");
        } else {
            toast.error(e.response?.data?.message || "خطا در آپلود وویس. لطفا فرمت یا حجم فایل را بررسی کنید.");
        }
    } finally {
        setIsUploading(false);
    }
  };

  const handleCreateInvite = async () => {
    if(!alias || !streamerName) return toast.error("تکمیل فیلدها الزامی است");
    try {
      await api.post(`/admin/streamer-invites`, { alias, streamerName, voiceUrl });
      toast.success("صفحه دعوت با موفقیت ساخته شد");
      setAlias(""); setStreamerName(""); setVoiceUrl("");
      fetchInvites();
    } catch(e: any) {
      toast.error(e.response?.data?.message || "خطا در ساخت صفحه دعوت");
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if(!window.confirm("از حذف این صفحه اطمینان دارید؟")) return;
    try {
      await api.delete(`/admin/streamer-invites/${id}`);
      toast.success("حذف شد");
      fetchInvites();
    } catch {
      toast.error("خطا در حذف");
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg text-white text-xl">
        دسترسی غیرمجاز
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <div className={cn("flex-1 min-w-0 p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto custom-scrollbar transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
        <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link to="/admin" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
                  <ArrowRight size={24} />
                </Link>
                <div className="h-10 w-10 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple border border-neon-purple/20">
                  <Shield size={24} />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter italic">مدیریت استریمرها</h1>
              </div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic opacity-60 mr-14">Streamer Partner Ecosystem</p>
            </div>
            <GlowButton 
              variant="purple"
              size="sm"
              className="h-12 px-6 text-[10px] uppercase font-black tracking-widest italic !rounded-2xl"
              onClick={fetchStreamers}
            >
              به‌روزرسانی اطلاعات
            </GlowButton>
          </header>

          <div className="flex gap-4 border-b border-white/5 pb-px overflow-x-auto">
             <button
               onClick={() => setActiveTab("streamers")}
               className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                 activeTab === "streamers" ? "text-neon-purple" : "text-gray-500 hover:text-gray-300"
               }`}
             >
               استریمرها
               {activeTab === "streamers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple shadow-[0_0_15px_#a855f7]" />}
             </button>
             <button
               onClick={() => setActiveTab("invites")}
               className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                 activeTab === "invites" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
               }`}
             >
               صفحات دعوت (پروپوزال)
               {activeTab === "invites" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
             </button>
          </div>

          <div className="space-y-6">
            {activeTab === "streamers" ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {streamers.map((s) => (
                 <NeonCard key={s.id} variant="purple" className="p-6 bg-dark-card/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <AuthorizedImage src={s.avatar || s.user?.avatar} className="w-14 h-14 rounded-2xl object-cover" />
                        <div>
                           <h3 className="text-lg font-black text-white flex items-center gap-2">
                              {s.user?.username || "---"}
                           </h3>
                           <div className="text-[10px] text-gray-400 font-mono mt-1 bg-white/5 px-2 py-0.5 rounded-md inline-block">
                              کد تخفیف: <span className="text-white font-bold">{s.discountCode}</span>
                           </div>
                        </div>
                      </div>
                      <button onClick={() => setEditingStreamerId(s.id)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                         <Edit3 size={16} />
                      </button>
                    </div>

                    {editingStreamerId === s.id ? (
                      <div className="mb-4">
                        <StreamerEditForm 
                           s={s} 
                           onSuccess={() => { setEditingStreamerId(null); fetchStreamers(); }} 
                           onCancel={() => setEditingStreamerId(null)} 
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 mb-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                         <div>
                           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">موجودی</p>
                           <p className="text-white font-mono">{s.balance?.toLocaleString()} <span className="text-[8px]">تومان</span></p>
                         </div>
                         <div>
                           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">کل درآمد</p>
                           <p className="text-white font-mono">{s.totalEarned?.toLocaleString()} <span className="text-[8px]">تومان</span></p>
                         </div>
                         <div>
                           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">تخفیف کاربر</p>
                           <p className="text-white font-mono">{s.userDiscountPercent}%</p>
                         </div>
                         <div>
                           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">سهم استریمر</p>
                           <p className="text-white font-mono">{s.streamerCommissionPercent}%</p>
                         </div>
                         <div className="col-span-2">
                           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">درخواست‌های معلق</p>
                           <p className="text-yellow-400 font-mono font-bold">{s.withdrawalRequests?.filter((w: any) => w.status === "PENDING").length || 0}</p>
                         </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {s.withdrawalRequests?.filter((w: any) => w.status === "PENDING").map((req: any) => (
                        <div key={req.id} className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl space-y-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-yellow-400 font-bold uppercase italic">درخواست تسویه</span>
                            <span className="text-white font-mono">{req.amount.toLocaleString()} تومان</span>
                          </div>
                          
                          <div className="text-[10px] text-gray-400 font-mono p-2 bg-black/40 rounded-lg whitespace-pre-wrap">
                            {s.paymentInfo || 'اطلاعات بانکی ثبت نشده است'}
                          </div>
                          
                          <div className="flex gap-2">
                            <GlowButton onClick={async () => {
                               const receiptUrl = prompt("لینک عکس رسید واریز را وارد کنید:");
                               if (!receiptUrl) return;
                               try {
                                 await api.post(`/admin/streamers/withdrawal/${req.id}/approve`, { receiptUrl });
                                 toast.success("درخواست تایید و پیام ارسال شد");
                                 fetchStreamers();
                               } catch {
                                 toast.error("خطا در تایید درخواست");
                               }
                            }} size="sm" variant="blue" className="w-full text-[9px] py-2">
                               تایید واریز
                            </GlowButton>
                            <GlowButton onClick={async () => {
                               const reason = prompt("علت رد درخواست چیست؟");
                               if (!reason) return;
                               try {
                                 await api.post(`/admin/streamers/withdrawal/${req.id}/reject`, { reason });
                                 toast.success("درخواست رد شد");
                                 fetchStreamers();
                               } catch {
                                 toast.error("خطا در رد درخواست");
                               }
                            }} size="sm" className="w-full text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-[9px] py-2">
                               رد کردن
                            </GlowButton>
                          </div>
                        </div>
                      ))}
                    </div>
                 </NeonCard>
               ))}
               {streamers.length === 0 && (
                 <div className="col-span-full py-20 text-center text-gray-500 font-bold">
                    استریمری در سیستم یافت نشد.
                 </div>
               )}
             </div>
            ) : activeTab === "invites" ? (
             <div className="space-y-6">
                <NeonCard variant="blue" className="p-6 bg-dark-card/50">
                  <h3 className="text-xl font-black text-white mb-4">ساخت صفحه دعوت جدید</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="text" placeholder="نام نمایشی استریمر (مثل: امیر)" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-neon-blue outline-none" value={streamerName} onChange={e => setStreamerName(e.target.value)} />
                    <input type="text" placeholder="شناسه اینوایت (لینک) مثل Rest_in_Peace" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-neon-blue outline-none" value={alias} onChange={e => setAlias(e.target.value)} dir="ltr" />
                    <div className="flex gap-2">
                       <input type="text" placeholder="URL وویس پیام استریمر" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-neon-blue outline-none" value={voiceUrl} onChange={e => setVoiceUrl(e.target.value)} dir="ltr" />
                       <input type="file" id="audio-upload" accept="audio/*" className="hidden" onChange={e => { if(e.target.files?.[0]) uploadVoice(e.target.files[0]) }} />
                       <label htmlFor="audio-upload" className={`flex items-center justify-center bg-white/10 border border-white/20 rounded-xl px-4 cursor-pointer hover:bg-white/20 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'آپلود'}
                       </label>
                    </div>
                  </div>
                  <GlowButton variant="blue" className="w-full md:w-auto" onClick={handleCreateInvite}>
                    ایجاد صفحه پروپوزال
                  </GlowButton>
                </NeonCard>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invites.map((inv) => (
                    <NeonCard key={inv.id} variant="blue" className="p-6 bg-dark-card/50 relative">
                       <button onClick={() => handleDeleteInvite(inv.id)} className="absolute top-4 left-4 text-red-500 bg-red-500/10 p-2 rounded-xl hover:bg-red-500/20">
                         حذف
                       </button>
                       <h3 className="text-lg font-black text-white">{inv.streamerName}</h3>
                       <p className="text-neon-blue font-mono text-xs mt-1">/invite/{inv.alias}</p>
                       <a href={`/invite/${inv.alias}`} target="_blank" className="mt-4 block text-center bg-white/5 border border-white/10 py-2 rounded-xl text-xs hover:bg-white/10 transition-colors">
                          مشاهده صفحه
                       </a>
                    </NeonCard>
                  ))}
                  {invites.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-500">صفحه دعوتی موجود نیست</div>
                  )}
                </div>
             </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
