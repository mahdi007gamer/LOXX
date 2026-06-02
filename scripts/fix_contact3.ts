import fs from 'fs';

let content = fs.readFileSync('src/pages/ContactPage.tsx', 'utf8');

const ticketBoxHTML = `

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
          </motion.div>
        )}
`;

content = content.replace('{/* Core About LOXX Text Card */}', ticketBoxHTML + '        {/* Core About LOXX Text Card */}');

fs.writeFileSync('src/pages/ContactPage.tsx', content);
console.log('Fixed ContactPage!!!');
