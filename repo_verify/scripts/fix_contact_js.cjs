const fs = require("fs");
let code = fs.readFileSync("src/pages/ContactPage.tsx", "utf8");

if (!code.includes("useEffect")) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';");
  code = code.replace("import React, { useState } from \"react\";", "import React, { useState, useEffect } from \"react\";");
}

if (!code.includes("myTickets")) {
    code = code.replace(
      'const [saving, setSaving] = useState(false);',
      `const [saving, setSaving] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    if (user) {
       fetchMyTickets();
    }
  }, [user]);

  const fetchMyTickets = async () => {
     setLoadingTickets(true);
     try {
       const res = await api.get("/reports/my-tickets");
       setMyTickets(res.data.data);
     } catch (e) { }
     finally { setLoadingTickets(false); }
  };`
    );

    code = code.replace(
        'toast.success(isRtl ? "پیام شما با موفقیت ارسال شد" : "Your message has been successfully sent");\n      setSupportMessage("");',
        'toast.success(isRtl ? "پیام شما با موفقیت ارسال شد" : "Your message has been successfully sent");\n      setSupportMessage("");\n      fetchMyTickets();'
    );
}

const ticketBox = `
        {/* Ticket Box - Only visible if logged in */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 mb-12"
          >
            <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase ">{isRtl ? "ارسال تیکت / گزارش" : "Submit Ticket / Report"}</h3>
                <p className="text-[10px] uppercase font-bold text-gray-500">{isRtl ? "ارتباط مستقیم با مدیریت" : "Contact the administration directly"}</p>
              </div>
            </div>

            {myTickets.some(t => t.status === 'PENDING') ? (
               <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 mt-4">
                 <div className="inline-flex h-12 w-12 rounded-full bg-orange-500/10 items-center justify-center text-orange-400 mb-4">
                    <MessageSquare size={24} />
                 </div>
                 <h4 className="text-sm font-black text-white mb-2">{isRtl ? "شما یک تیکت در حال بررسی دارید" : "You have a pending ticket"}</h4>
                 <p className="text-xs text-gray-400 font-medium">
                   {isRtl 
                     ? "تا زمانی که وضعیت تیکت فعلی شما مشخص نگردد، امکان ثبت تیکت جدید وجود ندارد." 
                     : "You cannot submit a new ticket until your current pending ticket is resolved."}
                 </p>
               </div>
            ) : (
                <>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase ">{isRtl ? "شرح پیام" : "Message Description"}</label>
                  <textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    dir={isRtl ? "rtl" : "ltr"}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-700 transition-all focus:border-neon-blue/50 focus:outline-none h-40 resize-none"
                    placeholder={isRtl ? "گزارش مشکل، باگ، یا پیشنهاد خود را اینجا بنویسید..." : "Describe bugs, issues, or specify your suggestions here..."}
                  />
                </div>

                <div className={cn("flex pt-4 border-t border-white/5 mt-6", isRtl ? "justify-end" : "justify-start")}>
                  <GlowButton 
                    variant="blue" 
                    className="px-10 h-10 text-[11px] font-black uppercase "
                    onClick={handleSendSupport}
                    disabled={saving}
                  >
                    {saving ? (isRtl ? "در حال ارسال..." : "Sending...") : (isRtl ? "ارسال پیام" : "Send Message")}
                  </GlowButton>
                </div>
                </>
            )}

            {/* Previous Tickets */}
            {myTickets.length > 0 && (
               <div className="mt-8 pt-8 border-t border-white/5">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4">{isRtl ? "تاریخچه تیکت‌ها" : "Ticket History"}</h4>
                  <div className="space-y-3">
                     {myTickets.map((ticket: any) => (
                        <div key={ticket.id} className="bg-dark-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex-1 overflow-hidden pr-4">
                               <p className="text-xs text-white truncate font-medium">{ticket.reason}</p>
                               <span className="text-[9px] text-gray-500 mt-1 block">
                                 {new Date(ticket.createdAt).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US')}
                               </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {ticket.status === 'PENDING' && (
                                   <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-bold rounded flex-shrink-0">
                                      {isRtl ? "در حال بررسی" : "Pending"}
                                   </span>
                                )}
                                {ticket.status === 'ACTIONED' && (
                                   <div className="flex items-center gap-2 flex-shrink-0">
                                     <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">
                                        {isRtl ? "پاسخ داده شده" : "Answered"}
                                     </span>
                                     <button 
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="text-[10px] font-black text-neon-blue bg-neon-blue/10 px-3 py-1 rounded hover:bg-neon-blue/20 transition-all font-sans"
                                     >
                                        {isRtl ? "پاسخ مدیریت" : "Admin Reply"}
                                     </button>
                                   </div>
                                )}
                                {ticket.status === 'REJECTED' && (
                                   <div className="flex items-center gap-2 flex-shrink-0">
                                     <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded">
                                        {isRtl ? "مردود" : "Rejected"}
                                     </span>
                                     {ticket.adminResponse && (
                                        <button 
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded hover:bg-red-500/20 transition-all font-sans"
                                        >
                                          {isRtl ? "دلیل رد شدن" : "Reason"}
                                        </button>
                                     )}
                                   </div>
                                )}
                            </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </motion.div>
        )}`;

const oldTicketBoxPattern = /\{user && \([\s\S]*?\{\/\* Core About LOXX Text Card \*\//;
if (code.match(oldTicketBoxPattern)) {
    code = code.replace(oldTicketBoxPattern, ticketBox + "\n        {/* Core About LOXX Text Card */}");
}

let target = "</div>\n      <Footer />\n    </div>\n  </div>\n  );\n};";
let replacement = `</div>
      <Footer />
    </div>

    {/* Response Modal */}
    {selectedTicket && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-[#121418] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
               <X size={20} />
            </button>
            <h3 className="text-lg font-black text-white mb-4">{isRtl ? "نظارت و پاسخ مدیریت" : "Admin Response"}</h3>
            
            <div className="space-y-4 text-left" dir={isRtl ? "rtl" : "ltr"}>
               <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1 mb-1"><MessageSquare size={12}/> {isRtl ? "پیام شما" : "Your Message"}</label>
                  <div className="bg-white/5 p-3 rounded-xl text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.reason}</div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-neon-blue uppercase flex items-center gap-1 mb-1">
                     <Shield size={12} /> {isRtl ? "پاسخ مدیریت" : "Response"}
                  </label>
                  <div className="bg-neon-blue/10 border border-neon-blue/20 p-4 rounded-xl text-sm text-white whitespace-pre-wrap leading-relaxed font-black">
                     {selectedTicket.adminResponse || (isRtl ? "موردی ثبت نشده است" : "No response provided")}
                  </div>
               </div>
            </div>
         </div>
      </div>
    )}

  </div>
  );
};`;

if (!code.includes("Response Modal")) {
  if (code.includes(target)) {
     code = code.replace(target, replacement);
  }
}

fs.writeFileSync("src/pages/ContactPage.tsx", code);
console.log("ContactPage Javascript fix done!");
