import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/layout/Sidebar";
import * as Icons from "lucide-react";
import { Shield, ArrowRight, Globe, FileText, FilePlus2, Trash2, ExternalLink } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { NeonCard } from "../components/ui/NeonCard";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export const AdminEnamadPage = () => {
  const { isSidebarCollapsed } = useAuth();
  
  const [enamadConfig, setEnamadConfig] = useState<any>({ siteTitle: "لوکس | پلتفرم بازی های آنلاین", enamadMetaCode: "46418638" });
  const [enamadFiles, setEnamadFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Fetch eNamad configuration and dynamic files
  const fetchEnamadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/enamad");
      setEnamadConfig(res.data.data.config || { siteTitle: "", enamadMetaCode: "" });
      setEnamadFiles(res.data.data.files || []);
    } catch (err: any) {
      toast.error("خطا در دریافت اطلاعات اینماد از سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnamadData();
  }, []);

  const handleUpdateConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await api.post("/admin/enamad/config", {
        siteTitle: enamadConfig.siteTitle,
        enamadMetaCode: enamadConfig.enamadMetaCode
      });
      toast.success(res.data.message || "تغییرات متادیتا با موفقیت ذخیره شد");
      fetchEnamadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در بروزرسانی متادیتا");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName || !newFileContent) {
      toast.error("لطفا نام فایل و محتوای آن را وارد کنید");
      return;
    }
    setIsCreatingFile(true);
    try {
      const res = await api.post("/admin/enamad/files", {
        filename: newFileName.trim(),
        content: newFileContent.trim()
      });
      toast.success(res.data.message || "فایل با موفقیت روی روت دامنه قرار گرفت");
      setNewFileName("");
      setNewFileContent("");
      fetchEnamadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در بوجود آوردن فایل احراز هویت");
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleDeleteFile = async (id: string, filename: string) => {
    if (!confirm(`آیا از حذف دائم فایل تاییدیه loxx.ir/${filename} اطمینان دارید؟`)) return;
    try {
      await api.delete(`/admin/enamad/files/${id}`);
      toast.success("فایل تاییدیه با موفقیت حذف گردید");
      fetchEnamadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف فایل");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020205] text-white">
      <Sidebar />
      
      <div className={cn(
        "flex-1 min-w-0 p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto custom-scrollbar transition-all duration-300", 
        !isSidebarCollapsed ? "md:mr-64" : "md:mr-20"
      )}>
        <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
          
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link to="/admin" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white" title="بازگشت به پنل مدیریت">
                  <ArrowRight size={24} />
                </Link>
                <div className="h-10 w-10 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                  <Shield size={24} />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter italic">مدیریت و تاییدیه اینماد (eNamad)</h1>
              </div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic opacity-60 mr-14">
                eNamad trust label & Search Engine Meta Injection
              </p>
            </div>
            
            <GlowButton 
              variant="blue"
              size="sm"
              className="h-12 px-6 text-[10px] uppercase font-black tracking-widest italic !rounded-2xl"
              onClick={fetchEnamadData}
            >
              به‌روزرسانی اطلاعات سرور
            </GlowButton>
          </header>

          {loading ? (
            <div className="py-24 text-center text-gray-500 font-bold text-xs">
              <Icons.Loader2 className="animate-spin mx-auto text-neon-blue mb-3" size={32} />
              درحال استخراج پیکربندی اینماد از دیتابیس...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Right Panel - Configuration Metadata & File Host List */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Meta Configuration Card */}
                <NeonCard variant="blue" className="p-6 border-neon-blue/30 bg-[#0d0d12]/65">
                  <h3 className="flex items-center gap-2 text-md font-black text-white italic mb-2">
                    <Globe className="text-neon-blue" size={18} />
                    تنظیمات متادیتا و عنوان اصلی سایت loxx.ir
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    در این بخش می‌توانید عنوان موقت صفحه نمایش داده شده به مرورگر یا خزنده‌ها و کد تاییدیه اینماد را جهت بررسی تزریق کنید. متاتگ به طور اتوماتیک به هدر کدهای سمت سرور تزریق خواهد شد.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 font-bold mb-2">عنوان لایو صفحه اصلی (سیستم سئو و موتورهای پایش)</label>
                      <input 
                        type="text"
                        value={enamadConfig.siteTitle || ""}
                        onChange={(e) => setEnamadConfig({ ...enamadConfig, siteTitle: e.target.value })}
                        placeholder="مثلا: لوکس | پیشرفته‌ترین راهکار بازی‌ها"
                        className="w-full bg-[#050508]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/40 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 font-bold mb-2">کد منحصربه‌فرد متاتگ اینماد (enamad content code)</label>
                      <div className="space-y-2">
                        <input 
                          type="text"
                          value={enamadConfig.enamadMetaCode || ""}
                          onChange={(e) => setEnamadConfig({ ...enamadConfig, enamadMetaCode: e.target.value })}
                          placeholder="مثلا: 46418638"
                          className="w-full bg-[#050508]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/40 font-mono font-bold"
                        />
                        <p className="text-[10px] text-gray-500 font-mono">
                          تگ تزریقی نهایی: &lt;meta name="enamad" content="{enamadConfig.enamadMetaCode || '46418638'}" /&gt;
                        </p>
                      </div>
                    </div>

                    <GlowButton 
                      variant="blue"
                      className="h-11 font-black px-8 mt-2 text-xs"
                      disabled={isSavingConfig}
                      onClick={handleUpdateConfig}
                    >
                      {isSavingConfig ? "در حال بروزرسانی درگاه..." : "بروزرسانی متادیتا و عنوان"}
                    </GlowButton>
                  </div>
                </NeonCard>

                {/* Plaintext dynamic files */}
                <NeonCard variant="blue" className="p-6 border-white/5 bg-[#0d0d12]/65">
                  <h3 className="flex items-center gap-2 text-md font-black text-white italic mb-4">
                    <FileText className="text-neon-blue" size={18} />
                    فایل‌های تایید هویت روت دامنه (Hosted Plaintext Files)
                  </h3>

                  {enamadFiles.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 font-bold bg-[#0d0d12]/40 rounded-xl border border-white/5">
                      هیچ فایل تاییدیه متنی فعالی در روت سایت loxx.ir ثبت نشده است.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enamadFiles.map((f: any) => (
                        <div 
                          key={f.id}
                          className="flex items-center justify-between p-4 bg-[#0d0d12]/60 hover:bg-[#0d0d12]/90 border border-white/10 rounded-xl transition-all"
                        >
                          <div className="space-y-1 text-right">
                            <span className="text-xs font-black text-white font-mono flex items-center gap-2 justify-end">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              {f.filename}
                            </span>
                            <p className="text-[10px] text-gray-500 font-bold max-w-sm truncate">
                              محتویات درون فایل: <span className="text-gray-400 font-mono">{f.content}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <a 
                              href={`/${f.filename}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-neutral-800 transition-all font-bold text-[10px] text-gray-300 flex items-center gap-1"
                            >
                              نمایش آنلاین در تَب جدید
                              <ExternalLink size={10} />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(f.id, f.filename)}
                              className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/20 transition-all"
                              title="حذف فایل از روی سرور"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </NeonCard>
              </div>

              {/* Left Panel - Dynamic File Creator */}
              <div className="space-y-6">
                
                <NeonCard variant="pink" className="p-6 border-neon-pink/20 bg-[#0d0d12]/65">
                  <h3 className="flex items-center gap-2 text-md font-black text-white italic mb-4 font-black">
                    <FilePlus2 className="text-neon-pink" size={18} />
                    ایجاد فایل تایید هویت روت
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 font-bold mb-2">نام فایل تفصیلی به همراه پسوند (مثلا: 46418638.txt)</label>
                      <input 
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="46418638.txt"
                        className="w-full bg-[#050508]/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 font-bold mb-2">محتوای کد داخل فایل متنی</label>
                      <textarea 
                        rows={5}
                        value={newFileContent}
                        onChange={(e) => setNewFileContent(e.target.value)}
                        placeholder="کد تاییدیه دریافتی از اینماد..."
                        className="w-full bg-[#050508]/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-mono font-bold resize-none"
                      />
                    </div>

                    <GlowButton 
                      variant="pink"
                      className="w-full h-11 text-xs font-black mt-2"
                      disabled={isCreatingFile || !newFileName || !newFileContent}
                      onClick={handleCreateFile}
                    >
                      {isCreatingFile ? "در حال ارتباط و ساخت فایل..." : "ذخیره و انتشار فایل تایید"}
                    </GlowButton>
                  </div>
                </NeonCard>

                {/* Instruction Guideline CARD */}
                <NeonCard variant="blue" className="p-6 border-blue-500/10 bg-blue-500/5">
                  <h4 className="flex items-center gap-2 text-xs font-black text-white mb-2">
                    <Icons.ShieldCheck className="text-blue-400" size={14} />
                    مدیریت تایید هویت دامنه
                  </h4>
                  <ul className="text-[10px] text-gray-400 space-y-2.5 leading-relaxed font-semibold">
                    <li>• معمولاً ربات‌های نظارتی نماد اعتماد الکترونیکی (eNamad) برای اعتبارسنجی مالکیت دامنه <code>loxx.ir</code>، آپلود فایل متنی حاوی کد تایید یا تزریق متاتگ در هدر را می‌خواهند.</li>
                    <li>• با این پنل تخصصی، بلافاصله و بدون ویرایش دستی فایل‌های هاست یا سرور، تغییرات را داینامیک و آنی ذخیره و اعمال کنید.</li>
                  </ul>
                </NeonCard>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
