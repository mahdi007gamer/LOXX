const fs = require("fs");
let code = fs.readFileSync("src/pages/AdminPage.tsx", "utf8");

// find {report.status === "PENDING" && (
const searchStr = '{report.status === "PENDING" && (';
const searchIndex = code.indexOf(searchStr);

const actionGridPrefix = `<div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">`;
const ticketActions = `
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

const ticketActionsEnd = `
                        </>
                    )}`;

if (searchIndex !== -1 && !code.includes('RESPOND_TICKET')) {
    let beforeGrid = code.substring(0, searchIndex);
    let rest = code.substring(searchIndex);
    
    // Inject our conditional rendering logic.
    // The existing action buttons are replaced partially.
    // Actually, it's easier to find the grid and replace the top and bottom of it.
    
    let gridStart = rest.indexOf(actionGridPrefix);
    if (gridStart !== -1) {
        let afterGridStart = rest.substring(gridStart + actionGridPrefix.length);
        let endOfGrid = afterGridStart.indexOf('</div>\n                  )}'); // roughly
        if (endOfGrid !== -1) {
             let originalButtons = afterGridStart.substring(0, endOfGrid);
             let afterGrid = afterGridStart.substring(endOfGrid);
             
             let modifiedGridBody = ticketActions + originalButtons + "\n" + ticketActionsEnd;
             
             let finalRest = rest.substring(0, gridStart + actionGridPrefix.length) + modifiedGridBody + afterGrid;
             code = beforeGrid + finalRest;
        }
    }
}

fs.writeFileSync("src/pages/AdminPage.tsx", code);
console.log("AdminPage patched!");
