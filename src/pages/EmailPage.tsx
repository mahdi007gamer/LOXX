import React, { useState, useEffect } from "react";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import * as Icons from "lucide-react";
import { 
  Mail, Send, Inbox, Trash2, Plus, RefreshCw, 
  Search, CheckCheck, Loader2, ArrowLeft, ArrowUpRight, CheckCircle2
} from "lucide-react";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

export const EmailPage = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [activeMessage, setActiveMessage] = useState<any>(null);
  
  // Create / Manage Email Account
  const [newAccountPrefix, setNewAccountPrefix] = useState("");
  const [newAccountLabel, setNewAccountLabel] = useState("");
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // New Message Compose State
  const [composeFrom, setComposeFrom] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Search/Filters
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<"all" | "inbox" | "sent">("all");
  const [loading, setLoading] = useState(true);
  const [isSimulatingIncoming, setIsSimulatingIncoming] = useState(false);

  // Fetch Accounts and Messages
  const fetchEmailData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch domain email addresses
      const accRes = await api.get("/email/accounts");
      const fetchedAccounts = accRes.data.data || [];
      setAccounts(fetchedAccounts);

      // Set default compose sender if not set
      if (fetchedAccounts.length > 0 && !composeFrom) {
        setComposeFrom(fetchedAccounts[0].address);
      }

      // 2. Fetch email messages
      const queryParam = selectedAccount !== "all" ? `?account=${encodeURIComponent(selectedAccount)}` : "";
      const msgRes = await api.get(`/email/messages${queryParam}`);
      setMessages(msgRes.data.data || []);
    } catch (err: any) {
      toast.error("خطا در بارگذاری ایمیل‌های سیستم دامنه");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailData();
  }, [selectedAccount]);

  // Mark a message as read
  const handleSelectMessage = async (msg: any) => {
    setActiveMessage(msg);
    if (msg.isIncoming && !msg.isRead) {
      try {
        await api.patch(`/email/messages/${msg.id}/read`);
        // Silently update list state
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
        // Refresh accounts metadata too if needed
      } catch (err) {
        console.error("Failed to mark message as read");
      }
    }
  };

  // Create accounts
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountPrefix) return;
    setIsCreatingAccount(true);
    try {
      const address = `${newAccountPrefix.trim().toLowerCase()}@loxx.ir`;
      const res = await api.post("/email/accounts", {
        address,
        label: newAccountLabel.trim() || "ایمیل عمومی دامنه"
      });
      toast.success(res.data.message || "ایمیل اختصاصی ساخته شد!");
      setNewAccountPrefix("");
      setNewAccountLabel("");
      setShowCreateAccountModal(false);
      fetchEmailData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ایجاد ایمیل");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Delete account of domain
  const handleDeleteAccount = async (id: string, address: string) => {
    if (address === "info@loxx.ir") {
      toast.error("ایمیل سازمانی پیش‌فرض info@loxx.ir غیرقابل حذف است.");
      return;
    }
    if (!confirm(`آیا از حذف دائم صندوق ایمیل ${address} همراه با تمامی مکاتبات متصل اطمینان دارید؟`)) return;
    try {
      await api.delete(`/email/accounts/${id}`);
      toast.success("حساب ایمیل به طور کامل حذف شد");
      if (selectedAccount === address) {
        setSelectedAccount("all");
      }
      fetchEmailData();
    } catch (err: any) {
      toast.error("خطا در فرآیند حذف حساب");
    }
  };

  // Submit outgoing email message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeFrom || !composeTo || !composeSubject || !composeBody) {
      toast.error("لطفا تمامی فیلدها را با قوانین تاییدیه پر کنید");
      return;
    }
    setIsSending(true);
    try {
      const res = await api.post("/email/messages/send", {
        fromAddress: composeFrom,
        toAddress: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody.trim()
      });
      toast.success("ایمیل سازمانی با موفقیت در صف ارسال قرار گرفت.");
      setShowComposeModal(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      
      // Auto refresh immediately
      await fetchEmailData(true);

      // Simulating real-time auto-reply (since server has a 3s delay simulated response)
      setTimeout(() => {
        fetchEmailData(true);
        toast("📬 پاسخ خودکار جدیدی دریافت گردید!", { icon: "📨" });
      }, 3500);

    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در برقراری ارتباط با میل‌سرور");
    } finally {
      setIsSending(false);
    }
  };

  // Simulate an incoming webhook or test email representation
  const handleTriggerSimulateIncoming = async () => {
    setIsSimulatingIncoming(true);
    try {
      const targetAcc = selectedAccount === "all" ? (accounts[0]?.address || "info@loxx.ir") : selectedAccount;
      const res = await api.post("/email/messages/receive-test", {
        toAddress: targetAcc
      });
      toast.success(res.data.message || "شبیه‌سازی دریافت موفق!");
      fetchEmailData(true);
    } catch (err) {
      toast.error("خطا در شبیه‌سازی دریافت میل");
    } finally {
      setIsSimulatingIncoming(false);
    }
  };

  // Delete specific email message representation
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("آیا مایل به انتقال دائمی این پیام به صندوق زباله (حذف کامل) هستید؟")) return;
    try {
      await api.delete(`/email/messages/${id}`);
      toast.success("پیام با موفقیت حذف گردید");
      setActiveMessage(null);
      fetchEmailData(true);
    } catch (err) {
      toast.error("خطا در حذف پیام");
    }
  };

  // Filtered Messages calculations
  const filteredMessages = messages.filter((m) => {
    // 1. Folder check
    if (folderFilter === "inbox" && !m.isIncoming) return false;
    if (folderFilter === "sent" && m.isIncoming) return false;

    // 2. Search check & queries
    if (messageSearchQuery.trim()) {
      const q = messageSearchQuery.toLowerCase();
      const subjectMatch = m.subject?.toLowerCase().includes(q);
      const bodyMatch = m.body?.toLowerCase().includes(q);
      const fromMatch = m.fromAddress?.toLowerCase().includes(q);
      const toMatch = m.toAddress?.toLowerCase().includes(q);
      return subjectMatch || bodyMatch || fromMatch || toMatch;
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in text-right" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Mail className="text-neon-pink" size={28} />
            میل‌سرور اختصاصی LOXX (loxx.ir)
          </h1>
          <p className="text-xs text-gray-400 font-bold">
            صندوق دریافت، مدیریت کدهای تاییدیه هویت، اینماد و مکاتبات تاییدیه مشتریان و سازمان‌ها
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleTriggerSimulateIncoming()}
            disabled={isSimulatingIncoming}
            className="px-4 h-10 text-xs bg-neon-pink/10 border border-neon-pink/30 hover:bg-neon-pink/20 text-neon-pink font-black rounded-lg transition-all flex items-center gap-2"
          >
            {isSimulatingIncoming ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Icons.Sparkles size={14} />
            )}
            شبیه‌سازی دریافت ایمیل تست
          </button>
          <GlowButton 
            variant="pink" 
            className="h-10 text-xs font-black px-5"
            onClick={() => {
              if (accounts.length === 0) {
                toast.error("لطفا ابتدا صندوق آدرسی ایجاد کنید");
                return;
              }
              setShowComposeModal(true);
            }}
          >
            <Send size={14} className="ml-2" />
            ایجاد و ارسال ایمیل جدید
          </GlowButton>
          <button 
            onClick={() => fetchEmailData()}
            className="h-10 w-10 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all flex items-center justify-center"
            title="بروزرسانی صندوق‌"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* RIGHT COLUMN: Sidebar (Addresses & Folders) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Email Accounts List */}
          <NeonCard variant="pink" className="p-4 border-neon-pink/10 bg-[#0d0d12]/65">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-white italic">صندوق‌های رسمی دامین</span>
              <button 
                onClick={() => setShowCreateAccountModal(true)}
                className="h-6 w-6 bg-neon-pink/10 border border-neon-pink/30 hover:bg-neon-pink/20 text-neon-pink rounded-md transition-all flex items-center justify-center"
                title="افزودن صندوق ایمیل لایو"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedAccount("all")}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all font-bold ${
                  selectedAccount === "all" 
                    ? "bg-neon-pink/10 border-neon-pink/30 text-neon-pink" 
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>نمایش کل نامه‌ها (همه‌ حساب‌ها)</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                  {messages.length}
                </span>
              </button>

              {accounts.map((acc) => {
                const unreadCount = messages.filter(m => m.toAddress === acc.address && m.isIncoming && !m.isRead).length;
                return (
                  <div 
                    key={acc.id}
                    className={`w-full group rounded-xl border overflow-hidden transition-all ${
                      selectedAccount === acc.address
                        ? "bg-neutral-900 border-neon-pink/20"
                        : "bg-[#050508]/40 border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <button
                        onClick={() => setSelectedAccount(acc.address)}
                        className="flex-1 text-right"
                      >
                        <p className="text-xs font-black text-white font-mono truncate">{acc.address}</p>
                        <p className="text-[10px] text-gray-500 font-bold truncate mt-0.5">{acc.label}</p>
                      </button>

                      {acc.address !== "info@loxx.ir" ? (
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.address)}
                          className="h-7 w-7 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center justify-center border border-transparent hover:border-red-500/20 md:opacity-0 group-hover:opacity-100 transition-opacity"
                          title="حذف کامل این حساب متنی"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span className="text-[9px] text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/20 px-2 py-0.5 rounded-md font-bold">
                          اصلی
                        </span>
                      )}

                      {unreadCount > 0 && (
                        <span className="mr-1 shadow-[0_0_10px_#FF007F] h-2 w-2 rounded-full bg-neon-pink" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </NeonCard>

          {/* Folder switchers */}
          <NeonCard variant="blue" className="p-4 border-white/5 bg-[#0d0d12]/65">
            <span className="text-xs font-black text-white italic block mb-3">پوشه‌ها</span>
            <div className="space-y-2">
              <button 
                onClick={() => setFolderFilter("all")}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${
                  folderFilter === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Icons.Folder size={14} className="text-[#00e5ff]" />
                همه دریافتی و ارسالی‌ها
              </button>
              <button 
                onClick={() => setFolderFilter("inbox")}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${
                  folderFilter === "inbox" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Inbox size={14} className="text-neon-pink" />
                صندوق ورودی (Inbox)
              </button>
              <button 
                onClick={() => setFolderFilter("sent")}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${
                  folderFilter === "sent" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Send size={14} className="text-neon-purple" />
                صندوق ارسالی (Sent)
              </button>
            </div>
          </NeonCard>
        </div>

        {/* MIDDLE COLUMN: Message List */}
        <div className="lg:col-span-1.5 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="جستجو در متن یا موضوع مکاتبه..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pr-11 pl-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-bold"
            />
          </div>

          {/* List Box container */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-24 text-center text-gray-500 font-bold text-xs">
                <Loader2 className="animate-spin mx-auto text-neon-pink mb-3" size={24} />
                درحال برقراری ارتباط با بانک اطلاعاتی لوکس...
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="py-24 text-center text-gray-500 font-bold text-xs bg-[#0d0d12]/30 border border-white/5 rounded-3xl">
                هیچ پیامی در این صندوق یا با این وضعیت پیدا نشد.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isActive = activeMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-4 rounded-2xl border text-right cursor-pointer transition-all ${
                      isActive 
                        ? "bg-[#111118] border-neon-pink/30 shadow-[0_0_15px_rgba(255,0,127,0.05)]" 
                        : msg.isIncoming && !msg.isRead
                          ? "bg-neon-pink/[0.02] hover:bg-white/5 border-neon-pink/10"
                          : "bg-[#0d0d12]/50 hover:bg-white/5 border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-500 font-mono font-bold">
                        {new Date(msg.createdAt).toLocaleTimeString("fa-IR", {hour: '2-digit', minute:'2-digit'})}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          msg.isIncoming 
                            ? "bg-neon-pink/10 text-neon-pink border border-neon-pink/15" 
                            : "bg-neon-purple/10 text-neon-purple border border-neon-purple/15"
                        }`}>
                          {msg.isIncoming ? "ورودی" : "ارسالی"}
                        </span>
                        {msg.isIncoming && !msg.isRead && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-pink animate-pulse" />
                        )}
                      </div>
                    </div>

                    <h4 className={`text-xs text-white truncate font-black ${msg.isIncoming && !msg.isRead ? "font-black" : "font-semibold"}`}>
                      {msg.subject || "بدون موضوع"}
                    </h4>

                    <p className="text-[10px] text-gray-500 font-mono font-bold truncate mt-1">
                      {msg.isIncoming ? `از: ${msg.fromAddress}` : `به: ${msg.toAddress}`}
                    </p>

                    <p className="text-[10px] text-gray-400 font-bold truncate mt-2 leading-relaxed">
                      {msg.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Message Detail Viewer */}
        <div className="lg:col-span-1.5">
          {activeMessage ? (
            <NeonCard variant="pink" className="p-6 border-neon-pink/10 bg-[#0d0d12]/80 h-full flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* Subject Header */}
                <div className="border-b border-white/5 pb-4 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <h2 className="text-sm font-black text-white leading-relaxed">
                      {activeMessage.subject}
                    </h2>
                    <button 
                      onClick={() => handleDeleteMessage(activeMessage.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="حذف دائمی این پیام"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-500 font-black">
                    تاریخ فرستاده شده: {new Date(activeMessage.createdAt).toLocaleString("fa-IR")}
                  </p>
                </div>

                {/* Sender/Receiver Details Card */}
                <div className="bg-[#050508]/60 p-3 rounded-xl border border-white/5 space-y-1.5">
                  <p className="text-xs text-gray-400 font-black">
                    فرستنده: <span className="text-white font-mono select-all">{activeMessage.fromAddress}</span>
                  </p>
                  <p className="text-xs text-gray-400 font-black">
                    گیرنده: <span className="text-white font-mono select-all">{activeMessage.toAddress}</span>
                  </p>
                </div>

                {/* Email Body Plaintext */}
                <div className="text-xs text-gray-300 font-semibold leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-4 rounded-xl border border-white/5 max-h-[350px] overflow-y-auto">
                  {activeMessage.body}
                </div>

              </div>

              {/* Compose Quick Action */}
              <div className="pt-6 border-t border-white/5 mt-6">
                <GlowButton 
                  variant="pink" 
                  className="w-full text-xs font-black h-11"
                  onClick={() => {
                    setComposeTo(activeMessage.isIncoming ? activeMessage.fromAddress : activeMessage.toAddress);
                    setComposeSubject(`Re: ${activeMessage.subject}`);
                    setComposeFrom(activeMessage.isIncoming ? activeMessage.toAddress : activeMessage.fromAddress);
                    setShowComposeModal(true);
                  }}
                >
                  <Icons.Reply size={13} className="ml-2" />
                  پاسخ صریح به فرستنده
                </GlowButton>
              </div>

            </NeonCard>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Mail className="text-gray-600 mb-3" size={32} />
              <p className="text-xs font-black">هیچ پیامی جهت نمایش انتخاب نشده است</p>
              <p className="text-[10px] mt-1 text-gray-600 font-semibold">برای نمایش جزییات نامه و پاسخ دهی هوشمند، یکی از ایمیل‌های لیست را انتخاب کنید.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: Create Email Account Address */}
      <AnimatePresence>
        {showCreateAccountModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Plus size={16} className="text-neon-pink" />
                  ایجاد حساب ایمیل سازمانی جدید
                </h3>
                <button 
                  onClick={() => setShowCreateAccountModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-bold mb-2">پیشوند ایمیل (آدرس قبل @loxx.ir)</label>
                  <div className="flex items-center bg-white/5 border border-white/5 rounded-xl overflow-hidden focus-within:border-neon-pink/40">
                    <input 
                      type="text"
                      required
                      value={newAccountPrefix}
                      onChange={(e) => setNewAccountPrefix(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))}
                      placeholder="مثلا: support"
                      className="flex-1 bg-transparent px-4 py-3 text-xs text-white focus:outline-none font-mono"
                    />
                    <span className="px-4 py-3 bg-white/5 text-gray-500 text-xs font-mono font-bold">
                      @loxx.ir
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-bold mb-2">برچسب / عنوان صندوق (توضیح دلخواه)</label>
                  <input 
                    type="text"
                    value={newAccountLabel}
                    onChange={(e) => setNewAccountLabel(e.target.value)}
                    placeholder="مثلا: واحد پشتبانی مالی زرین‌پال"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-bold"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <GlowButton 
                    type="submit"
                    variant="pink" 
                    className="flex-1 text-xs font-black h-11"
                    disabled={isCreatingAccount || !newAccountPrefix}
                  >
                    {isCreatingAccount ? "درحال آماده‌سازی سرور..." : "ایجاد و پیکربندی صندوق"}
                  </GlowButton>
                  <button 
                    type="button"
                    onClick={() => setShowCreateAccountModal(false)}
                    className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-neutral-800 rounded-xl font-bold text-xs text-gray-300 transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Compose & Send Outgoing Message */}
      <AnimatePresence>
        {showComposeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Send size={16} className="text-neon-pink" />
                  ارسال مکاتبه جدید از دامنه لایو loxx.ir
                </h3>
                <button 
                  onClick={() => setShowComposeModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4 text-right">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 font-bold mb-2">ارسال از صندوق</label>
                    <select
                      value={composeFrom}
                      onChange={(e) => setComposeFrom(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-mono font-bold appearance-none cursor-pointer"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.address} className="bg-black text-white font-mono">
                          {acc.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 font-bold mb-2">گیرنده مکاتبه (ایمیل معتبر)</label>
                    <input 
                      type="email"
                      required
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="مثلا: cooperation@filimo.com"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-bold mb-2">موضوع نامه سازمانی / عنوان تاییدیه</label>
                  <input 
                    type="text"
                    required
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="مثلا: پیگیری تاییدیه پرونده مالی و درگاه"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-bold mb-2">محتوای تفصیلی مکاتبه رسمی</label>
                  <textarea 
                    rows={6}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="متن خود را فارسی یا انگلیسی یادداشت کنید..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-bold resize-none"
                  />
                </div>

                <div className="bg-neon-blue/5 border border-neon-blue/10 p-3 rounded-lg text-[10px] text-gray-400 leading-relaxed font-semibold">
                  💡 <strong>شبیه‌ساز هوشمند پاسخ خودکار:</strong> در صورتی که به دامنه‌های کارشناسی <code>enamad.ir</code>, <code>zarinpal.com</code>, یا <code>google.com</code> ایمیل بنویسید، پاسخ اداری شبیه‌سازی‌شده‌ای بلافاصله دریافت خواهید کرد.
                </div>

                <div className="pt-2 flex gap-3">
                  <GlowButton 
                    type="submit"
                    variant="pink" 
                    className="flex-1 text-xs font-black h-11"
                    disabled={isSending}
                  >
                    {isSending ? "در حال مخابره به میل‌سرور..." : "ارسال نهایی پیام رسمی"}
                  </GlowButton>
                  <button 
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-neutral-800 rounded-xl font-bold text-xs text-gray-300 transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
