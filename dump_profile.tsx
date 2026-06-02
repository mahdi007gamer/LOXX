const renderProfile = () => (
 <div className="space-y-6">
 {isVip && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative group cursor-pointer mb-8"
 onClick={() => navigate("/settings/elite")}
 >
 <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
 <NeonCard variant="gold" className="relative transition-transform group-hover:scale-[1.01] overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
 <Crown size={120} />
 </div>
 <div className="flex items-center justify-between relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 rounded-[20px] bg-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-xl shadow-yellow-400/10 transition-transform group-hover:rotate-6">
 <Crown size={32} />
 </div>
 <div>
 <h3 className="text-xl font-black text-white uppercase ">
 {isRtl ? "تنظیمات نخبگان (Elite Settings)" : "Elite Settings (VIP & Streamer)"}
 </h3>
 <p className="text-[10px] text-yellow-400/70 font-bold uppercase mt-1">
 {isRtl ? "شخصی‌سازی پیشرفته مینی‌پروفایل، فریم‌ها و افکت‌های VIP" : "Advanced customization of mini-profile, frames, and VIP aura effects"}
 </p>
 </div>
 </div>
 <div className="h-12 w-12 rounded-full border border-yellow-400/30 flex items-center justify-center group-hover:bg-yellow-400/10 transition-all">
 <ArrowRight className={cn("text-yellow-400 transition-transform", isRtl ? "-rotate-45 group-hover:rotate-0" : "rotate-135 group-hover:rotate-180")} />
 </div>
 </div>
 </NeonCard>
 </motion.div>
 )}

 <NeonCard variant="blue" className="space-y-8">
 <div className="flex items-center gap-6">
 <div className="group relative">
 <div className="h-24 w-24 rounded-[32px] bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
 {formData.avatarUrl || formData.username ? (
 <SmartImage 
 src={formData.avatarUrl || ""} 
 alt={formData.displayName}
 className="w-full h-full object-cover" 
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center text-neon-blue">
 <User size={40} />
 </div>
 )}
 </div>
 </div>
 <div className="flex-1">
 <h3 className="font-black text-white ">{isRtl ? "تصویر پروفایل" : "Profile Picture"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 mb-3">
 {isRtl ? "تصویر خود را آپلود کنید (فقط فرمت‌های PNG و JPG)." : "Upload your profile icon (PNG, JPG and WEBP formats supported)."}
 </p>
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-none">
 <input 
 type="file" 
 accept="image/png, image/jpeg, image/gif, image/webp" 
 className="hidden" 
 id="avatar-upload"
 onChange={async (e) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
 if (!allowedTypes.includes(file.type)) {
 toast.error(isRtl ? "فقط فایل‌های JPG، PNG، GIF و WEBP مجاز هستند" : "Only JPG, PNG, GIF, and WEBP formats are allowed");
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 toast.error(isRtl ? "حجم فایل نباید بیشتر از ۵ مگابایت باشد" : "File size cannot exceed 5MB");
 return;
 }
 const data = new FormData();
 data.append("file", file);
 try {
 const res = await api.post("/upload?target=profile", data, {
 headers: { "Content-Type": "multipart/form-data" }
 });
 if (res.data.url) {
 setFormData(p => ({ ...p, avatarUrl: res.data.url }));
 toast.success(isRtl ? "تصویر با موفقیت آپلود شد" : "Avatar uploaded successfully");
 }
 } catch {
 toast.error(isRtl ? "خطا در آپلود تصویر" : "Error uploading avatar image");
 }
 }
 }}
 />
 <label htmlFor="avatar-upload" className="h-[46px] px-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black cursor-pointer hover:bg-white/10 hover:border-neon-blue/30 transition-all text-white shrink-0">
 <Camera size={16} className={cn(isRtl ? "ml-2" : "mr-2")} />
 {isRtl ? "آپلود تصویر" : "Upload Avatar"}
 </label>
 </div>
 </div>
 <div className={cn("mt-2", isRtl ? "text-right" : "text-left")}>
 <button onClick={() => setFormData(p => ({ ...p, avatarUrl: "" }))} className="text-[10px] text-gray-600 font-black uppercase hover:text-neon-pink transition-colors">
 {isRtl ? "حذف تصویر" : "Remove Avatar"}
 </button>
 </div>
 </div>
 </div>

 <hr className="border-white/5" />

 <div className="flex items-center gap-6">
 <div className="flex-1">
 <h3 className="font-black text-white ">{isRtl ? "تصویر کاور (بنر)" : "Profile Cover (Banner)"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 mb-3">
 {isRtl ? "تصویر بنر پروفایل خود را آپلود کنید (حداکثر ۵ مگابایت، JPG، PNG، GIF و WEBP)." : "Upload profile banner image (Max 5MB, JPG, PNG, GIF, WEBP)."}
 </p>
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-none">
 <input 
 type="file" 
 accept="image/png, image/jpeg, image/gif, image/webp" 
 className="hidden" 
 id="banner-upload"
 onChange={async (e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 
 const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
 if (!allowedTypes.includes(file.type)) {
 toast.error("فقط فایل‌های JPG، PNG، GIF و WEBP مجاز هستند");
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 toast.error("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
 return;
 }
 
 const data = new FormData();
 data.append("file", file);
 try {
 const res = await api.post("/upload/banner?target=cover", data, {
 headers: { "Content-Type": "multipart/form-data" }
 });
 if (res.data.url) {
 setFormData(p => ({ ...p, bannerUrl: res.data.url }));
 toast.success("بنر با موفقیت آپلود شد");
 }
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در آپلود بنر");
 }
 }}
 />
 <label htmlFor="banner-upload" className="h-[46px] px-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black cursor-pointer hover:bg-white/10 hover:border-neon-blue/30 transition-all text-white shrink-0">
 <Camera size={16} className={cn(isRtl ? "ml-2" : "mr-2")} />
 {isRtl ? "آپلود بنر" : "Upload Banner"}
 </label>
 </div>
 </div>
 {formData.bannerUrl && (
 <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-24 w-full">
 <SmartImage src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
 </div>
 )}
 <div className={cn("mt-2", isRtl ? "text-right" : "text-left")}>
 <button onClick={() => setFormData(p => ({ ...p, bannerUrl: "" }))} className="text-[10px] text-gray-600 font-black uppercase hover:text-neon-pink transition-colors">
 {isRtl ? "حذف بنر" : "Remove Cover"}
 </button>
 </div>
 </div>
 </div>

 <hr className="border-white/5" />

 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
 <Input 
 label={isRtl ? "نام نمایشی" : "Display Name"} 
 placeholder={isRtl ? "Ali_Gamer_98" : "e.g. Maverick_98"} 
 value={formData.displayName}
 onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
 />
 <Input 
 label={isRtl ? "آیدی یکتا (Handle)" : "Unique Handle (Username)"} 
 placeholder="aligamer" 
 value={formData.username}
 disabled
 />
 <div className="sm:col-span-2">
 <label className="block px-1 text-[10px] font-black text-gray-500 uppercase mb-2 ">
 {isRtl ? "درباره شما (Bio)" : "About You (Bio)"}
 </label>
 <textarea 
 className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-700 transition-all focus:border-neon-blue/50 focus:outline-none h-32 resize-none"
 placeholder={isRtl ? "کمی در مورد خودتان، بازی‌هایی که دوست دارید و ... بنویسید" : "Tell us a bit about yourself, games you play..."}
 value={formData.bio}
 onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
 />
 </div>
 </div>

 <div className={cn("flex pt-4 border-t border-white/5", isRtl ? "justify-end" : "justify-start")}>
 <GlowButton 
 variant="blue" 
 className="px-10 h-10 text-[11px] font-black uppercase "
 onClick={handleSaveProfile}
 disabled={saving}
 >
 {saving ? (isRtl ? "در حال ذخیره..." : "Saving...") : (isRtl ? "ذخیره تغییرات پروفایل" : "Save Profile Changes")}
 </GlowButton>
 </div>
 </NeonCard>
 </div>
 );

 const handleEnable2FA = async () => {
 try {
 setSaving(true);
 await api.post("/user/me/2fa/enable");
 setShowTwoFactorModal(true);
 toast.success("کد تایید پیامکی به شماره همراه شما ارسال شد");
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در برقراری ارتباط");
 } finally {
 setSaving(false);
 }
 };

 const handleVerify2FA = async () => {
 try {
 setSaving(true);
 await api.post("/user/me/2fa/verify", { code: twoFactorCode });
 toast.success("تایید دو مرحله‌ای با موفقیت فعال شد");
 setShowTwoFactorModal(false);
 setTwoFactorEnabled(true);
 setTwoFactorCode("");
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "کد اشتباه است");
 } finally {
 setSaving(false);
 }
 };

 const handleDisable2FA = async () => {
 try {
 setSaving(true);
 await api.post("/user/me/2fa/disable");
 toast.success("تایید دو مرحله‌ای غیرفعال شد");
 setTwoFactorEnabled(false);
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در انجام عملیات");
 } finally {
 setSaving(false);
 }
 };

 const handleVerifyEmailByToken = async () => {
 try {
 setSaving(true);
 await api.post("/auth/verify-email", { token: verificationCode });
 toast.success("ایمیل شما با موفقیت تایید شد");
 setShowVerificationModal(false);
 if (refreshUser) refreshUser();
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "توکن معتبر نمی‌باشد");
 } finally {
 setSaving(false);
 }
 };

 const handleSendVerificationEmail = async () => {
 try {
 setSaving(true);
 await api.post("/auth/send-verification-email");
 toast.success("کد تایید به ایمیل شما ارسال شد");
 setShowVerificationModal(true);
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در ارسال ایمیل تایید");
 } finally {
 setSaving(false);
 }
 };

 const SecurityStatusCard = ({ title, status, desc, icon, color }: any) => {
 return (
 <div className={cn(
 "p-5 rounded-2xl border transition-all flex flex-col h-full",
 color === 'green' ? "bg-green-500/5 border-green-500/20" : 
 color === 'blue' ? "bg-neon-blue/5 border-neon-blue/20" : 
 "bg-red-500/5 border-red-500/20"
 )}>
 <div className="flex items-center justify-between mb-4">
 <div className={cn(
 "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
 color === 'green' ? "bg-green-500/10 text-green-400" : 
 color === 'blue' ? "bg-neon-blue/10 text-neon-blue" : 
 "bg-red-500/10 text-red-400"
 )}>
 {icon}
 </div>
 <span className={cn(
 "text-[10px] font-black uppercase px-3 py-1 rounded-full",
 color === 'green' ? "bg-green-500/20 text-green-400" : 
 color === 'blue' ? "bg-neon-blue/20 text-neon-blue" : 
 "bg-red-500/20 text-red-400"
 )}>{status}</span>
 </div>
 <h4 className="text-sm font-black text-white mb-1">{title}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">{desc}</p>
 </div>
 );
 };

 const renderSecurity = () => (
 <div className="space-y-6">
 <NeonCard variant="purple" className="space-y-8">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-black text-white mb-1 flex items-center gap-2">
 {isRtl ? "وضعیت تایید حساب" : "Account Verification Status"}
 {authUser?.isVerified ? (
 <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "حساب تایید شده" : "Verified Account"}</span>
 ) : (
 <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "حساب تایید نشده" : "Unverified Account"}</span>
 )}
 </h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? (authUser?.isVerified ? "هویت شما با موفقیت تایید شده است." : "برای دسترسی به تمامی امکانات، حساب خود را تایید کنید") : (authUser?.isVerified ? "Your identity is verified and in good standing." : "Verify your account email to access all platform features.")}</p>
 </div>
 {!authUser?.isVerified && (
 <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase px-6 border-none" onClick={handleSendVerificationEmail}>{isRtl ? "تایید پروفایل" : "Verify Profile"}</GlowButton>
 )}
 </div>
 </div>

 <hr className="border-white/5" />

 <div>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-black text-white mb-1 flex items-center gap-2">
 {isRtl ? "تایید دو مرحله‌ای (SMS)" : "Two-Factor Auth (SMS)"} 
 {twoFactorEnabled ? (
 <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "فعال" : "Enabled"}</span>
 ) : (
 <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "غیرفعال" : "Disabled"}</span>
 )}
 </h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? "کد تایید امنیتی هنگام ورود به شماره همراه شما پیامک خواهد شد" : "Security codes will be messaged to your phone when you log in."}</p>
 </div>
 {twoFactorEnabled ? (
 <GlowButton variant="purple" size="sm" className="text-[10px] font-black uppercase px-6 border-none bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 shadow-none" onClick={handleDisable2FA} disabled={saving}>{isRtl ? "غیرفعال‌سازی 2FA" : "Disable 2FA"}</GlowButton>
 ) : (
 <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase px-6 border-none" onClick={handleEnable2FA} disabled={saving}>{isRtl ? "فعال‌سازی 2FA" : "Enable 2FA"}</GlowButton>
 )}
 </div>
 </div>

 {/* 2FA Modal */}
 <AnimatePresence>
 {(showTwoFactorModal || showVerificationModal) && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 onClick={() => { setShowTwoFactorModal(false); setShowVerificationModal(false); setSetupStep("initial"); }}
 />
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
 className="relative w-full max-w-sm rounded-[24px] bg-[#0a0a0f] border border-white/10 p-8 shadow-2xl overflow-hidden"
 style={{ transformOrigin: "center center" }}
 onMouseMove={(e) => e.stopPropagation()}
 >
 {showVerificationModal ? (
 <>
 <h3 className="text-xl font-black text-white mb-2">تایید ایمیل</h3>
 <p className="text-xs text-gray-500 font-bold mb-6 ">توکن ارسال شده به ایمیل خود را وارد کنید</p>
 <Input 
 label="توکن تایید"
 placeholder="توکن را اینجا قرار دهید"
 value={verificationCode}
 onChange={(e) => setVerificationCode(e.target.value)}
 />
 <div className="mt-6 flex flex-col gap-3">
 <GlowButton variant="blue" className="w-full text-xs font-black uppercase blur-none shadow-none h-12" onClick={handleVerifyEmailByToken} disabled={saving || !verificationCode}>تایید ایمیل</GlowButton>
 <button onClick={() => { setShowVerificationModal(false); }} className="h-10 text-xs font-black text-gray-500 hover:text-white uppercase transition-colors">بعداً انجام میدم</button>
 </div>
 </>
 ) : (
 <>
 <h3 className="text-xl font-black text-white mb-2">تایید دو مرحله‌ای پیامکی</h3>
 <p className="text-xs text-gray-500 font-bold mb-6 ">کد تایید ارسال شده به شماره همراه خود را وارد کنید</p>
 <Input 
 label="کد تایید"
 placeholder="مثلا 123456"
 value={twoFactorCode}
 onChange={(e) => setTwoFactorCode(e.target.value)}
 />
 <div className="mt-6 flex justify-end gap-3">
 <button onClick={() => { setShowTwoFactorModal(false); setSetupStep("initial"); }} className="px-4 text-xs font-black text-gray-500 hover:text-white uppercase">انصراف</button>
 <GlowButton variant="blue" className="px-8 text-xs font-black uppercase blur-none shadow-none" onClick={handleVerify2FA} disabled={saving || twoFactorCode.length < 5}>ثبت و فعالسازی</GlowButton>
 </div>
 </>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <hr className="border-white/5" />

 <div>
 <h3 className="font-black text-white mb-1">{isRtl ? "تغییر رمز عبور" : "Change Password"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 ">{isRtl ? "برای امنیت بیشتر از رمزهای طولانی استفاده کنید" : "Use custom long passwords for maximum security."}</p>
 <div className="space-y-6 max-w-md">
 <Input 
 label={isRtl ? "رمز عبور فعلی" : "Current Password"} 
 type="password" 
 value={formData.currentPassword}
 onChange={(e) => setFormData(p => ({ ...p, currentPassword: e.target.value }))}
 />
 <Input 
 label={isRtl ? "رمز عبور جدید" : "New Password"} 
 type="password" 
 value={formData.newPassword}
 onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
 />
 <Input 
 label={isRtl ? "تکرار رمز عبور جدید" : "Confirm New Password"} 
 type="password" 
 value={formData.confirmPassword}
 onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
 />
 </div>
 <div className="mt-6">
 <GlowButton 
 variant="purple" 
 className="px-10 h-10 text-[11px] font-black uppercase "
 onClick={handlePasswordChange}
 disabled={saving}
 >
 {saving ? (isRtl ? "در حال تغییر..." : "Updating...") : (isRtl ? "به‌روزرسانی رمز عبور" : "Update Password")}
 </GlowButton>
 </div>
 </div>

 <hr className="border-white/5" />

 <div>
 <h3 className="font-black text-white mb-4">{isRtl ? "دستگاه‌های متصل" : "Connected Devices"}</h3>
 <div className="space-y-3">
 {(devices || []).map((session, i) => (
 <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-neon-blue transition-colors">
 <Smartphone size={20} />
 </div>
 <div>
 <h4 className="text-xs font-black text-white flex items-center gap-2">
 {session.deviceName}
 {i === 0 && <span className="text-[8px] text-neon-blue uppercase">{isRtl ? "اخیر" : "Recent"}</span>}
 </h4>
 <p className="text-[10px] text-gray-500 font-bold">{session.ipAddress}</p>
 </div>
 </div>
 <button onClick={() => handleRevokeDevice(session.id)} className="text-[10px] font-black text-neon-pink uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{isRtl ? "خروج" : "Logout"}</button>
 </div>
 ))}
 {(!devices || devices.length === 0) && (
 <p className="text-[10px] text-gray-500 font-bold uppercase">{isRtl ? "در حال بارگذاری..." : "Loading..."}</p>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <SecurityStatusCard 
 title={isRtl ? "وضعیت تایید حساب" : "Account Verification"} 
 status={authUser?.isVerified ? (isRtl ? "تایید شده" : "Verified") : (isRtl ? "در انتظار تایید" : "Pending")}
 desc={authUser?.isVerified ? (isRtl ? "حساب شما کاملاً تایید شده و به تمامی امکانات دسترسی دارید." : "Your account is high standing and fully verified.") : (isRtl ? "تایید ایمیل برای دسترسی به تمامی امکانات لابی و فروشگاه الزامی است." : "Please verify your email to unlock all lobbies, chat and store privileges.")}
 icon={<Mail size={20} className="text-neon-blue" />}
 color={authUser?.isVerified ? "green" : "red"}
 />
 <SecurityStatusCard 
 title={isRtl ? "تایید دو مرحله‌ای" : "2FA Protection"} 
 status={twoFactorEnabled ? (isRtl ? "فعال" : "Enabled") : (isRtl ? "غیرفعال" : "Disabled")}
 desc={twoFactorEnabled ? (isRtl ? "تایید دو مرحله‌ای فعال است و امنیت حساب شما را تضمین می‌کند." : "2FA protection is armed and securing your sessions.") : (isRtl ? "برای جلوگیری از دسترسی غیرمجاز، تایید دو مرحله‌ای را فعال کنید." : "Secure your account from remote brute force attacks by enabling 2FA SMS.")}
 icon={<Lock size={20} className="text-neon-purple" />}
 color={twoFactorEnabled ? "green" : "blue"}
 />
 <SecurityStatusCard 
 title={isRtl ? "محافظت از اکانت" : "Account Protection"} 
 status={isRtl ? "تحت نظارت" : "Monitored"}
 desc={isRtl ? "سیستم ضد تقلب و محافظت از اکانت لoxx به صورت ۲۴ ساعته فعال است." : "The LOXX anti-cheat and token guard system is active 24/7."}
 icon={<SecurityAlert size={20} className="text-neon-pink" />}
 color="green"
 />
 </div>

 </NeonCard>
 </div>
 );

 
