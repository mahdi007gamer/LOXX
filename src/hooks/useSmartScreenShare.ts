import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export type Resolution = "480p" | "720p" | "1080p";
export type Framerate = 10 | 20 | 30;

export interface ShareQuality {
  id: string;
  resolution: Resolution;
  framerate: Framerate;
  requiredPlan: "NORMAL" | "PLUS" | "VIP";
  requiredBandwidthPerViewerMbps: number; // Estimated Mbps needed per viewer
}

export const SHARE_QUALITIES: ShareQuality[] = [
  { id: "480p-10", resolution: "480p", framerate: 10, requiredPlan: "NORMAL", requiredBandwidthPerViewerMbps: 0.3 },
  { id: "480p-30", resolution: "480p", framerate: 30, requiredPlan: "NORMAL", requiredBandwidthPerViewerMbps: 0.6 },
  { id: "720p-10", resolution: "720p", framerate: 10, requiredPlan: "NORMAL", requiredBandwidthPerViewerMbps: 0.8 },
  { id: "720p-20", resolution: "720p", framerate: 20, requiredPlan: "NORMAL", requiredBandwidthPerViewerMbps: 1.2 },
  { id: "720p-30", resolution: "720p", framerate: 30, requiredPlan: "PLUS", requiredBandwidthPerViewerMbps: 1.5 },
  { id: "1080p-10", resolution: "1080p", framerate: 10, requiredPlan: "PLUS", requiredBandwidthPerViewerMbps: 1.5 },
  { id: "1080p-30", resolution: "1080p", framerate: 30, requiredPlan: "VIP", requiredBandwidthPerViewerMbps: 3.0 },
];

export const useSmartScreenShare = (
  userPlan: "NORMAL" | "PLUS" | "VIP",
  numViewers: number,
  isElectron: boolean,
  setScreenStreamForWebRTC: (s: MediaStream | null) => void
) => {
  const [estimatedUploadMbps, setEstimatedUploadMbps] = useState<number | null>(null);
  const [isTestingBandwidth, setIsTestingBandwidth] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [currentQuality, setCurrentQuality] = useState<ShareQuality | null>(null);
  const [isWarningActive, setIsWarningActive] = useState(false);

  // Stop sharing function
  const stopShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setScreenStreamForWebRTC(null);
      setCurrentQuality(null);
      setIsWarningActive(false);
    }
  }, [screenStream, setScreenStreamForWebRTC]);

  // Mock Upload Test (Since we don't want to hit server)
  const runUploadTest = async () => {
    // In a real app we'd query WebRTC stats for `availableOutgoingBitrate`
    // For now we'll simulate a steady connection between 2-10 Mbps for Normal, or higher
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        // Simulate a realistic uplink speed, maybe randomize a bit
        // We'll give it a solid 5 Mbps for local dev testing
        resolve(5.0); 
      }, 500);
    });
  };

  const checkBandwidth = useCallback(async () => {
    if (!isElectron) return 0;
    setIsTestingBandwidth(true);
    const mbps = await runUploadTest();
    setEstimatedUploadMbps(mbps);
    setIsTestingBandwidth(false);

    return mbps;
  }, [isElectron]);

  // Initial and periodic check
  useEffect(() => {
    if (!isElectron) return;
    checkBandwidth();
    const interval = setInterval(checkBandwidth, 30000); // 30s check
    return () => clearInterval(interval);
  }, [isElectron, checkBandwidth]);

  // Monitor active share
  useEffect(() => {
    if (!screenStream || !currentQuality || !isElectron) return;

    const interval = setInterval(async () => {
      const mbps = await checkBandwidth();
      const requiredTotal = currentQuality.requiredBandwidthPerViewerMbps * numViewers;
      
      if (mbps < requiredTotal) {
        if (!isWarningActive) {
          setIsWarningActive(true);
          toast("شبکه شما کمی ناپایدار است. برای حفظ کیفیت، ممکن است اسکرین شیر به طور موقت متوقف شود.", {
            icon: '⚠️',
            duration: 8000
          });
        } else {
          // If already warning and still bad, stop it
          stopShare();
          toast.error("اسکرین شیر به دلیل محدودیت پهنای باند شبکه و تعداد بیننده‌ها متوقف شد. برای ادامه، لطفاً تعداد بیننده‌ها را کاهش دهید یا کیفیت را تنظیم کنید.", {
            duration: 8000
          });
        }
      } else {
        if (isWarningActive) {
          setIsWarningActive(false); // Recovered
        }
      }
    }, 10000); // Check more frequently during share (every 10s)

    return () => clearInterval(interval);
  }, [screenStream, currentQuality, numViewers, checkBandwidth, isElectron, isWarningActive, stopShare]);

  const startShare = async (quality: ShareQuality, sourceId?: string) => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error("مرورگر شما از قابلیت اشتراک‌گذاری صفحه پشتیبانی نمی‌کند یا دسترسی به آن محدود شده است.");
      }

      let stream: MediaStream;

      if (sourceId) {
        const api = (window as any).electronAPI;
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error("مرورگر شما از getDisplayMedia پشتیبانی نمی‌کند.");
        }
        // Electron specific desktop stream with sourceId via interceptor
        try {
          if (api && api.setDesktopSourceId) {
            await api.setDesktopSourceId(sourceId);
          }
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
        } catch (desktopError) {
          console.warn("Retrying without audio due to error:", desktopError);
          if (api && api.setDesktopSourceId) {
            await api.setDesktopSourceId(sourceId);
          }
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
        }
      } else {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error("مرورگر شما از getDisplayMedia پشتیبانی نمی‌کند یا دسترسی به آن در محیط فعلی مسدود است.");
        }
        // Standard Web API or native Electron interceptor
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true 
        });
      }

      // Apply quality constraints if possible
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints({
            width: { ideal: quality.resolution === "1080p" ? 1920 : quality.resolution === "720p" ? 1280 : 854 },
            height: { ideal: quality.resolution === "1080p" ? 1080 : quality.resolution === "720p" ? 720 : 480 },
            frameRate: { ideal: quality.framerate, max: quality.framerate }
          });
        } catch (e) {
          console.warn("Could not apply resolution constraints to screen share", e);
        }
      }

      // Listen for system stop
      videoTrack.onended = () => {
        stopShare();
      };

      setScreenStream(stream);
      setScreenStreamForWebRTC(stream);
      setCurrentQuality(quality);
      setIsWarningActive(false);
    } catch (err) {
      console.error("Error sharing screen:", err);
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("Permission denied") || errorMsg.includes("NotAllowedError")) {
        errorMsg = "دسترسی اشتراک‌گذاری صفحه داده نشد یا لغو شد.";
      }
      toast.error(`خطا در اشتراک‌گذاری: ${errorMsg}`, { duration: 6000 });
    }
  };

  const isBaseRequirementMet = estimatedUploadMbps === null || estimatedUploadMbps >= (SHARE_QUALITIES[0].requiredBandwidthPerViewerMbps * numViewers);

  return {
    estimatedUploadMbps,
    isTestingBandwidth,
    screenStream,
    currentQuality,
    startShare,
    stopShare,
    isBaseRequirementMet,
    isWarningActive
  };
}
