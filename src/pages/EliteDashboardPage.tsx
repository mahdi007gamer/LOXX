import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import {
  Zap,
  Wallet,
  BarChart3,
  Upload,
  CreditCard,
  ChevronRight,
  Download,
  CheckCircle2,
  Settings as SettingsIcon,
  Copy,
  Globe,
  Radio,
  Save,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import api from "../lib/api";
import toast from "react-hot-toast";

export const EliteDashboardPage = () => {
  const { user, updateUser, isSidebarCollapsed } = useAuth();
  const [activeTab, setActiveTab] = useState<"settings" | "revenue">("revenue");

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");

  const [streamerLinks, setStreamerLinks] = useState({
    aparat: "",
    twitch: "",
    kick: "",
    youtube: "",
    donate: "",
  });

  const [savingLinks, setSavingLinks] = useState(false);

  useEffect(() => {
    if (user?.vipMetadata) {
      try {
        const parsed =
          typeof user.vipMetadata === "string"
            ? JSON.parse(user.vipMetadata)
            : user.vipMetadata;
        if (parsed?.streamerLinks) {
          setStreamerLinks({
            aparat: parsed.streamerLinks.aparat || "",
            twitch: parsed.streamerLinks.twitch || "",
            kick: parsed.streamerLinks.kick || "",
            youtube: parsed.streamerLinks.youtube || "",
            donate: parsed.streamerLinks.donate || "",
          });
        }
      } catch (e) {
        console.error(
          "Error parsing user.vipMetadata inside EliteDashboardPage",
          e,
        );
      }
    }
  }, [user]);

  const handleSaveLinks = async () => {
    setSavingLinks(true);
    try {
      const parsed =
        typeof user?.vipMetadata === "string"
          ? JSON.parse(user.vipMetadata)
          : user?.vipMetadata || {};
      const updatedMetadata = {
        ...parsed,
        streamerLinks,
      };

      await api.patch("/user/profile", {
        vipMetadata: JSON.stringify(updatedMetadata),
      });
      if (updateUser) {
        updateUser({ vipMetadata: updatedMetadata });
      }
      toast.success("لینک‌های همکار با موفقیت بروزرسانی شد");
    } catch (e) {
      toast.error("خطا در ذخیره‌سازی لینک‌ها");
    } finally {
      setSavingLinks(false);
    }
  };

  useEffect(() => {
    if (user?.role === "STREAMER" || user?.role === "ADMIN") {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/streamers/stats");
      setStats(data.data);
      if (data.data?.paymentInfo) {
        setPaymentInfo(data.data.paymentInfo);
      }
    } catch {
      toast.error("خطا در دریافت اطلاعات استریمر");
    } finally {
      setLoading(false);
    }
  };

  const balance = stats?.balance || 0;
  const totalEarned = stats?.totalEarned || 0;
  const discountCode = stats?.discountCode || "";
  const referrersCount = stats?.paymentsRef?.length || 0;

  const handleUpdateInfo = async () => {
    try {
      await api.post("/streamers/update-info", { paymentInfo });
      toast.success("شماره کارت / شبا با موفقیت بروزرسانی شد");
    } catch {
      toast.error("خطا در بروزرسانی اطلاعات");
    }
  };

  const handleWithdrawal = async () => {
    try {
      const numAmount = parseInt(withdrawalAmount.replace(/,/g, ""));
      if (isNaN(numAmount) || numAmount < 50000) {
        return toast.error("حداقل مبلغ برداشت ۵۰,۰۰۰ تومان است");
      }
      if (numAmount > balance) {
        return toast.error("مبلغ درخواستی بیشتر از موجودی شماست");
      }

      await api.post("/streamers/withdraw", { amount: numAmount });
      toast.success("درخواست برداشت با موفقیت ثبت شد");
      setWithdrawalAmount("");
      fetchStats();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا در ثبت درخواست برداشت");
    }
  };

  if (user?.role !== "STREAMER" && user?.role !== "ADMIN") {
    return (
      <div className="flex h-screen bg-[#050507]">
        <Sidebar />
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-400">دسترسی غیرمجاز</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020204]">
      <Sidebar />
      <main
        className={cn(
          "flex-1 px-4 py-8 lg:px-8 pb-32 md:pb-8 transition-all duration-300 w-full min-w-0 flex justify-center",
          !isSidebarCollapsed ? "md:mr-64 mr-0" : "md:mr-20 mr-0",
        )}
        dir="rtl"
      >
        <div className="w-full max-w-5xl space-y-8 animate-fade-in relative z-10">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

          <header className="flex flex-col gap-2 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Zap className="text-purple-400 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-500 to-fuchsia-500 tracking-tight">
                  داشبورد الیت استریمر
                </h1>
                <p className="text-sm font-bold text-gray-500 tracking-wider">
                  مرکز مدیریت یکپارچه و سیستم درآمدزایی
                </p>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-white/5 pb-2">
            <button
              onClick={() => setActiveTab("revenue")}
              className={cn(
                "px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2",
                activeTab === "revenue"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:bg-white/5",
              )}
            >
              <Wallet className="w-4 h-4" />
              مدیریت مالی
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2",
                activeTab === "settings"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:bg-white/5",
              )}
            >
              <SettingsIcon className="w-4 h-4" />
              تنظیمات ظاهری الیت
            </button>
          </div>

          {activeTab === "revenue" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0b0c10]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                  <span className="text-gray-400 text-sm font-bold mb-2">
                    موجودی قابل تسویه
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-purple-400 font-bold text-sm">
                      تومان
                    </span>
                  </div>
                </div>

                <div className="bg-[#0b0c10]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
                  <span className="text-gray-400 text-sm font-bold mb-2">
                    درآمد کل از ابتدا
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-300">
                      {totalEarned.toLocaleString()}
                    </span>
                    <span className="text-gray-500 font-bold text-sm">
                      تومان
                    </span>
                  </div>
                </div>

                <div className="bg-[#0b0c10]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue"></div>
                  <span className="text-gray-400 text-sm font-bold mb-2">
                    کاربران جذب‌شده با کد شما
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">
                      {referrersCount}
                    </span>
                    <span className="text-gray-500 font-bold text-sm">نفر</span>
                  </div>
                  <span className="text-xs text-neon-blue mt-2 font-bold opacity-80">
                    درصد مشارکت: 50%
                  </span>
                </div>
              </div>

              {/* GLASSMORPHIC STREAMER BONUS CARD */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden bg-purple-950/10 backdrop-blur-2xl border border-purple-500/20 p-8 rounded-3xl group shadow-[0_30px_70px_-15px_rgba(168,85,247,0.15)] flex flex-col md:flex-row items-center justify-between gap-8 mt-2"
              >
                {/* Sparkling / Glow Effects */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/[0.08] via-fuchsia-500/[0.04] to-transparent pointer-events-none transition-all duration-700 group-hover:opacity-80" />
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-right flex-1">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.25)] group-hover:scale-105 transition-all">
                    <Radio className="w-10 h-10 animate-pulse text-purple-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">
                      سیستم بازاریابی و پاداش همکاران
                    </span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2 italic justify-center md:justify-start">
                      <span>کد تخفیف و درآمدزایی استریمر</span>
                      <span className="text-[10px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full not-italic">
                        امکان تایید شده
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs font-bold text-gray-400 leading-relaxed max-w-xl">
                      <p className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
                        تخفیف تماشاگران شما:{" "}
                        <span className="text-purple-400 font-black">
                          ۱۰٪ تخفیف
                        </span>{" "}
                        در خرید اشتراک
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        سهم سود شما:{" "}
                        <span className="text-cyan-400 font-black">
                          ۵۰٪ کارمزد نقدی
                        </span>{" "}
                        مستقیم
                      </p>
                      <p className="flex items-center gap-2 sm:col-span-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        پرداختی به موقع: تسویه زیر ۲۴ ساعت کاری با کلیه حساب‌های
                        عضو شتاب.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Big Attractive Promo Code Widget */}
                <div className="relative z-10 flex flex-col items-center gap-3 bg-white/[0.02] border border-white/5 p-6 rounded-2xl min-w-[260px] hover:border-purple-500/30 transition-colors">
                  <span className="text-[10px] text-gray-400 font-bold tracking-widest">
                    کد معرف اختصاصی شما
                  </span>
                  <div
                    className="flex items-center gap-2 bg-[#050508] px-5 py-3 rounded-xl border border-white/5 relative group/code cursor-pointer"
                    onClick={() => {
                      if (discountCode) {
                        navigator.clipboard.writeText(discountCode);
                        toast.success("کد تخفیف اختصاصی شما با موفقیت کپی شد!");
                      }
                    }}
                  >
                    <span className="text-lg font-black tracking-[0.2em] text-purple-400 uppercase font-mono">
                      {discountCode || "موجود نیست"}
                    </span>
                    <Copy className="w-4 h-4 text-gray-500 group-hover/code:text-white transition-colors" />
                  </div>
                  <span className="text-[9px] text-gray-500 font-bold">
                    برای کپی کردن کد روی آن کلیک کنید
                  </span>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-2xl h-[400px]">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    درخواست تسویه
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 flex justify-between">
                        <span>شماره شبا یا کارت بانکی</span>
                        <button
                          onClick={handleUpdateInfo}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          ثبت دائمی اطلاعات
                        </button>
                      </label>
                      <input
                        type="text"
                        value={paymentInfo}
                        onChange={(e) => setPaymentInfo(e.target.value)}
                        placeholder="شماره شبا یا کارت جهت واریز"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-left focus:border-purple-500/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 flex justify-between">
                        <span>مبلغ درخواستی (تومان)</span>
                        <span className="text-gray-500">
                          حداقل ۵۰,۰۰۰ تومان
                        </span>
                      </label>
                      <input
                        type="text"
                        value={withdrawalAmount}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/,/g, "")
                            .replace(/\D/g, "");
                          if (val)
                            setWithdrawalAmount(parseInt(val).toLocaleString());
                          else setWithdrawalAmount("");
                        }}
                        placeholder="مثال: ۱۰۰,۰۰۰"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-purple-500/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>
                    <button
                      onClick={handleWithdrawal}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 mt-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
                    >
                      ثبت درخواست تسویه
                    </button>
                  </div>
                </div>

                <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-2xl h-[400px] overflow-y-auto custom-scrollbar">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    تاریخچه تسویه‌ها
                  </h3>
                  {stats?.withdrawalRequests &&
                  stats.withdrawalRequests.length > 0 ? (
                    <div className="space-y-3">
                      {stats.withdrawalRequests.map((req: any) => (
                        <div
                          key={req.id}
                          className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-white font-mono">
                              {req.amount.toLocaleString()} تومان
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {new Date(req.createdAt).toLocaleDateString(
                                "fa-IR",
                              )}
                            </p>
                          </div>
                          <div>
                            {req.status === "PENDING" && (
                              <span className="text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded">
                                در حال بررسی
                              </span>
                            )}
                            {req.status === "PAID" && (
                              <span className="text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded flex items-center gap-1">
                                <CheckCircle2 size={12} /> واریز شد
                              </span>
                            )}
                            {req.status === "REJECTED" && (
                              <span className="text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded">
                                رد شده
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                      <Download className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-bold">
                        هنوز تسویه‌ای انجام نشده
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0b0c10] border border-white/5 p-8 rounded-2xl">
                <h3 className="text-white font-bold mb-6">
                  تنظیمات ظاهری اختصاصی (Elite Customization)
                </h3>

                <div className="space-y-8">
                  <div className="flex border-b border-white/5 pb-8 flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-200 mb-1">
                        آواتار متحرک (GIF)
                      </h4>
                      <p className="text-xs text-gray-500 font-bold leading-relaxed">
                        شما به عنوان استریمر می‌توانید آواتارهای گیف آپلود کنید
                        تا پروفایلی زنده‌تر داشته باشید.
                      </p>
                    </div>
                    <button className="bg-white/5 border border-white/10 hover:border-purple-500/50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-400" /> آپلود GIF
                    </button>
                  </div>

                  <div className="flex border-b border-white/5 pb-8 flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-200 mb-1">
                        حباب چت نئونی
                      </h4>
                      <p className="text-xs text-gray-500 font-bold leading-relaxed">
                        تبدیل حباب پیام‌های شما در لابی و گپ‌های عمومی به حباب
                        درخشان الیت.
                      </p>
                    </div>
                    <button className="bg-purple-600/20 text-purple-400 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      فعال است
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                        نشان الیت{" "}
                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                      </h4>
                      <p className="text-xs text-gray-500 font-bold leading-relaxed">
                        تیک بنفش رنگ همواره در کنار نام کاربری شما در کلیه
                        لیست‌ها و جدول رنکینگ نمایش داده می‌شود.
                      </p>
                    </div>
                  </div>

                  {/* PARTNER STREAM LINKS */}
                  <div className="border-[#1b1c23] border bg-[#13141a]/50 p-6 rounded-2xl space-y-4 mt-8">
                    <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 mb-2 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-400" />
                      لینک‌های استریم و شبکه‌های اجتماعی استریمر
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-bold">
                      در این بخش لینک کانال‌های پخش زنده و دونیت خود را ثبت کنید. این لینک‌ها با استایل مدرن و چشمنواز در پروفایل شما برای کاربران نمایش داده می‌شوند تا با یک کلیک وارد پخش زنده شوند.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400">
                          لینک استریم آپارات (Aparat)
                        </label>
                        <input
                          type="text"
                          placeholder="https://aparat.com/username/live"
                          value={streamerLinks.aparat}
                          onChange={(e) =>
                            setStreamerLinks({
                              ...streamerLinks,
                              aparat: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-left text-xs focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all outline-none"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400">
                          لینک استریم توییچ (Twitch)
                        </label>
                        <input
                          type="text"
                          placeholder="https://twitch.tv/username"
                          value={streamerLinks.twitch}
                          onChange={(e) =>
                            setStreamerLinks({
                              ...streamerLinks,
                              twitch: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-left text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all outline-none"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400">
                          لینک استریم Kick (کیک)
                        </label>
                        <input
                          type="text"
                          placeholder="https://kick.com/username"
                          value={streamerLinks.kick}
                          onChange={(e) =>
                            setStreamerLinks({
                              ...streamerLinks,
                              kick: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-left text-xs focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all outline-none"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400">
                          لینک استریم یوتیوب (YouTube)
                        </label>
                        <input
                          type="text"
                          placeholder="https://youtube.com/c/username/live"
                          value={streamerLinks.youtube}
                          onChange={(e) =>
                            setStreamerLinks({
                              ...streamerLinks,
                              youtube: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-left text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all outline-none"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400">
                          لینک درگاه حمایت مالی / دونیت (Donate)
                        </label>
                        <input
                          type="text"
                          placeholder="https://sibmo.ir/username یا ریال‌باکس و..."
                          value={streamerLinks.donate}
                          onChange={(e) =>
                            setStreamerLinks({
                              ...streamerLinks,
                              donate: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-yellow-500 font-mono text-left text-xs focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all outline-none"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        disabled={savingLinks}
                        onClick={handleSaveLinks}
                        className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-xl text-sm font-black text-white hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {savingLinks ? "در حال ذخیره‌سازی..." : "ذخیره لینک‌های استریم"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper for generic Settings Icon since it wasn't re-imported above correctly
// Using imported SettingsIcon
