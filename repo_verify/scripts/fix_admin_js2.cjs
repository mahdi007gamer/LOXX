const fs = require("fs");
let code = fs.readFileSync("src/pages/AdminPage.tsx", "utf8");

const startPattern = '{report.status === "PENDING" && (\\n                  <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">';

if (code.includes('{report.status === "PENDING" && (')) {
   // Let's just replace the exact text
   const startReplacement = `{report.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">
                    {report.targetType === "TICKET" ? (
                       <>
                          <button
                            onClick={async () => {
                              const answer = prompt("متن پاسخ به تیکت کاربر:");
                              if (!answer) return;
                              try {
                                await api.post(\`/reports/admin/\${report.id}/action\`, { action: "RESPOND_TICKET", adminResponse: answer });
                                toast.success("تیکت پاسخ داده شد");
                                fetchData();
                              } catch { toast.error("خطا در پاسخ به تیکت"); }
                            }}
                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 col-span-2 rounded-lg text-[10px] font-black transition-colors"
                          >
                            ثبت پاسخ تیکت (تایید)
                          </button>
                          <button
                            onClick={async () => {
                              const answer = prompt("دلیل رد تیکت (اختیاری):");
                              try {
                                await api.post(\`/reports/admin/\${report.id}/action\`, { action: "REJECT_TICKET", adminResponse: answer });
                                toast.success("تیکت رد شد");
                                fetchData();
                              } catch { toast.error("خطا در رد تیکت"); }
                            }}
                            className="px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[10px] font-black transition-colors col-span-2 mt-1"
                          >
                            رد تیکت
                          </button>
                       </>
                    ) : (
                        <>`;

   // find the ending of the pending check
   // It ends with:
   /*
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/reports/admin/${report.id}/action`, { action: "DISMISS" });
                                toast.success("گزارش بسته شد");
                                fetchData();
                              } catch { toast.error("خطا"); }
                            }}
                            className="px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[10px] font-black transition-colors col-span-2 mt-1"
                          >
                            رد گزارش
                          </button>
                        </div>
                  )}
   */
   code = code.replace('{report.status === "PENDING" && (\n                  <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">', startReplacement);
   code = code.replace(/رد گزارش\s*<\/button>\s*<\/div>\s*\)\}/, "رد گزارش\n                          </button>\n          </>\n       )\n    }\n         </div>\n                  )}");
}

fs.writeFileSync("src/pages/AdminPage.tsx", code);
console.log("AdminPage JS rewrite applied");
