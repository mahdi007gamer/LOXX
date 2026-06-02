const fs = require('fs');
let code = fs.readFileSync('src/pages/DownloadPage.tsx', 'utf8');

// 1. Initial State Updates
code = code.replace(
  `const [downloadStep, setDownloadStep] = useState<
    "connecting" | "probing" | "downloading" | "completed" | "bypassed" | "failed"
  >("connecting");`,
  `const [downloadStep, setDownloadStep] = useState<
    "idle" | "connecting" | "probing" | "downloading" | "completed" | "bypassed" | "failed"
  >("idle");`
);
code = code.replace(
  `const [activeStepText, setActiveStepText] = useState("در حال برقراری اتصال امن با سرورهای مرکزی لوکس...");`,
  `const [activeStepText, setActiveStepText] = useState("آماده دانلود اختصاصی از سرور ابری. برای شروع روی دکمه کلیک کنید.");`
);

// 2. useEffect auto-start
code = code.replace(
  `useEffect(() => {
    if (downloadAttemptedRef.current) return;
    downloadAttemptedRef.current = true;
    runDownloadPipeline();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);`,
  `useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);`
);

// 3. Conditional rendering of progress bar container
// Let's replace the whole block if needed or just add a downloadStep !== "idle" condition inside the Action buttons area.
// Wait, the progress bar and status log are rendered before the Action buttons.
// Let's find: {/* Progress Header */} down to <div className="bg-[#0a0d20] border ... </div> </div>
// Better, let's just create a more robust regex for the Action buttons area:

const actionButtonsArea = `{/* Action buttons area */}
            <AnimatePresence mode="wait">
              {downloadStep === "idle" ? (
                 <motion.div
                   key="idle-btn"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="flex justify-center mt-6 animate-pulse"
                 >
                    <button
                       onClick={(e) => {
                          e.preventDefault();
                          if (!downloadAttemptedRef.current) {
                             downloadAttemptedRef.current = true;
                             runDownloadPipeline();
                          }
                       }}
                       className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg shadow-lg transition-all cursor-pointer flex items-center justify-center gap-3 bg-neon-blue text-dark-bg hover:shadow-[0_15px_40px_rgba(0,229,255,0.4)] hover:scale-105"
                    >
                       <Download size={24} />
                       بافر فعال ابری (شروع دانلود)
                    </button>
                 </motion.div>
              ) : downloadStep === "completed" || downloadStep === "bypassed" ? (
                <motion.div
                  key="completed-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4 animate-fade-in"
                >
                  <p className="text-xs font-bold text-emerald-400/90 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    {downloadStep === "bypassed" 
                      ? "پروسه بافر لغو شد. بلافاصله پنجره ذخیره مستقیم کلاینت برای شما گشوده شد."
                      : "دانلود به طور کامل انجام شد. در صورتی که پنجره ذخیره باز نشد روی دکمه زیر صدمه بزنید."}
                  </p>
                  <button
                    onClick={() => {
                      triggerNativeDownload(resolvedUrl, fileName);
                    }}
                    className={\`w-full sm:w-auto px-8 py-4 rounded-xl text-dark-bg font-black text-base shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 \${
                      downloadStep === "bypassed"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)]"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)]"
                    }\`}
                  >
                    <Download size={20} />
                    شروع دانلود مجدد با لینک پرسرعت
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="active-btns"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row justify-center gap-4 items-center"
                >
                  {/* Manual Bypass Button */}
                  <button
                    onClick={handleBypassBuffer}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/15 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer animate-pulse"
                  >
                    <Download size={18} className="text-neon-blue group-hover:translate-y-0.5 transition-transform" />
                    <span>لغو بافر اینترنتی و دانلود مستقیم فوری</span>
                  </button>

                  <button
                    onClick={handleRetry}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    <span>ریستارت دانلود</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>`;

code = code.replace(/\{\/\* Action buttons area \*\/\}[\s\S]*?<\/AnimatePresence>/, actionButtonsArea);

code = code.replace(/<span className="font-mono text-sm font-black text-white">\{progress\}%<\/span>/, 
  `{downloadStep !== "idle" && <span className="font-mono text-sm font-black text-white">{progress}%</span>}`
);

fs.writeFileSync('src/pages/DownloadPage.tsx', code);
console.log('DownloadPage.tsx updated successfully.');
