import fs from "fs";
let code = fs.readFileSync("src/pages/ContactPage.tsx", "utf8");

// We'll just put the modal just before the final </div></div>
code = code.replace(
  "</div>\n      <Footer />\n    </div>\n  </div>\n  );\n};",
  `</div>\n      <Footer />\n    </div>\n{selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-[#121418] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
              <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                 <X size={20} />
              </button>
              <h3 className="text-lg font-black text-white mb-4">{isRtl ? "نظارت و پاسخ مدیریت" : "Admin Response"}</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">{isRtl ? "پیام شما" : "Your Message"}</label>
                    <div className="bg-white/5 p-3 rounded-xl text-xs text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">{selectedTicket.reason}</div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-neon-blue uppercase flex items-center gap-1">
                       <Shield size={12} /> {isRtl ? "پاسخ" : "Response"}
                    </label>
                    <div className="bg-neon-blue/10 border border-neon-blue/20 p-4 rounded-xl text-sm text-white mt-1 whitespace-pre-wrap leading-relaxed font-bold">
                       {selectedTicket.adminResponse || (isRtl ? "موردی ثبت نشده است" : "No response provided")}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
  </div>
  );
};`
);

// We should also remove the previous `<>` injection if it broke things
code = code.replace("return (\n    <>", "return (");
code = code.replace("}\n\nexport default ContactPage;", "\nexport default ContactPage;");

fs.writeFileSync("src/pages/ContactPage.tsx", code);
console.log("ContactPage modal fixed");
