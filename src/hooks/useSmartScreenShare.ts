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
 const [estimatedUploadMbps, setEstimatedUploadMbps] = useState<number | null>(5.0);
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
 if (!isElectron) return 5.0; // Assume 5.0 in web too for premium feel
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

 // Monitor active share reactively for dynamic changes like new players joining
 useEffect(() => {
 if (!screenStream || !currentQuality) return;

 const currentUpload = estimatedUploadMbps || 5.0;
 const requiredTotal = currentQuality.requiredBandwidthPerViewerMbps * numViewers;

 if (currentUpload < requiredTotal) {
 stopShare();
 toast.error(
 `⚠️ اشتراک‌گذاری صفحه به دلیل افزایش بیننده‌های فعال به ${numViewers} نفر و محدودیت پهنای باند متوقف شد! برای این کیفیت پهنای باند ${requiredTotal.toFixed(1)} Mbps نیاز است در حالی که سرعت آپلود شما ${currentUpload.toFixed(1)} Mbps است.`, 
 { duration: 10000 }
 );
 }
 }, [numViewers, currentQuality, screenStream, estimatedUploadMbps, stopShare]);

 // Monitor active share periodically in background for stability
 useEffect(() => {
 if (!screenStream || !currentQuality || !isElectron) return;

 const interval = setInterval(async () => {
 const mbps = await checkBandwidth();
 const requiredTotal = currentQuality.requiredBandwidthPerViewerMbps * numViewers;
 
 if (mbps < requiredTotal) {
 stopShare();
 toast.error(`⚠️ اسکرین شیر به دلیل محدودیت پهنای باند آپلود و افزایش ترافیک شبکه متوقف شد. (سرعت آپلود فعلی: ${mbps.toFixed(1)} Mbps، مورد نیاز: ${requiredTotal.toFixed(1)} Mbps)`, {
 duration: 9000
 });
 }
 }, 15000); 

 return () => clearInterval(interval);
 }, [screenStream, currentQuality, numViewers, checkBandwidth, isElectron, stopShare]);

 const startShare = async (quality: ShareQuality, sourceId?: string) => {
 try {
 if (!navigator.mediaDevices) {
 throw new Error("مرورگر شما از قابلیت اشتراک‌گذاری صفحه پشتیبانی نمی‌کند یا دسترسی به آن محدود شده است.");
 }

 let stream: MediaStream;

 const api = (window as any).electronAPI;
 if (api && api.setDesktopSourceId) {
 // Tell main process which source to pick explicitly, or null to clear
 await api.setDesktopSourceId(sourceId || null);
 // Give IPC a tiny moment to settle before firing getDisplayMedia
 await new Promise(r => setTimeout(r, 100));
 }

 if (sourceId) {
 if (!navigator.mediaDevices.getDisplayMedia) {
 throw new Error("مرورگر شما از getDisplayMedia پشتیبانی نمی‌کند.");
 }
 
 if (sourceId.startsWith('window')) {
 // Electron window sources notoriously throw DOMException Could not start video source 
 // via getDisplayMedia natively in some cases, but we will rely solely on the main process 
 // intercept handling via setDisplayMediaRequestHandler to simplify the pipeline.
 try {
 console.log("Using getUserMedia fallback for window:", sourceId);
 stream = await navigator.mediaDevices.getUserMedia({
 audio: false,
 video: {
 mandatory: {
 chromeMediaSource: 'desktop',
 chromeMediaSourceId: sourceId
 }
 } as any
 });
 } catch(e) {
 console.error("Window capture via getUserMedia failed, retrying getDisplayMedia:", e);
 try {
 stream = await navigator.mediaDevices.getDisplayMedia({
 video: true,
 audio: true
 });
 } catch (err) {
 console.error("Window capture via getDisplayMedia failed, clearing source ID and throwing:", err);
 const api = (window as any).electronAPI;
 if (api && api.setDesktopSourceId) {
 await api.setDesktopSourceId(null);
 }
 
 let customErrorMessage = 'سیستم‌عامل نتوانست این پنجره را کپچر کند (احتمالاً به دلیل مینی‌مایز بودن یا محافظت سخت‌افزاری پنجره). لطفاً کل صفحه (Screen) را به اشتراک بگذارید.';
 if (api && api.isAdmin) {
 try {
 const isElevated = await api.isAdmin();
 if (isElevated) {
 customErrorMessage = 'به دلیل اجرای این برنامه با دسترسی Administrator، سیستم‌عامل اجازه اشتراک‌گذاری پنجره‌های عادی را نمی‌دهد. لطفاً برنامه را ببندید و در حالت عادی (بدون Run as admin) اجرا کنید یا از گزینه اشتراک‌گذاری کل صفحه (Screen) استفاده فرمایید.';
 }
 } catch (adminError) {
 console.warn("Failed to check admin status", adminError);
 }
 }
 throw new Error(customErrorMessage);
 }
 }
 } else {
 // Screen sources are fully supported natively via getDisplayMedia
 stream = await navigator.mediaDevices.getDisplayMedia({
 video: true,
 audio: true
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

 // Disable, stop, and completely remove audio tracks immediately to ensure absolutely no sound is sent or played
 if (stream) {
 stream.getAudioTracks().forEach((track) => {
 try {
 track.enabled = false;
 track.stop();
 stream.removeTrack(track);
 } catch (trackErr) {
 console.warn("Error stopping or removing captured screen audio track:", trackErr);
 }
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
 } else if (errorMsg.includes("Could not start video source")) {
 errorMsg = "نمی‌توان این پنجره را به اشتراک گذاشت. ممکن است پنجره کوچک (Minimize) شده باشد یا در پس‌زمینه مسدود باشد. لطفاً پنجره را باز کنید و دوباره تلاش کنید.";
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
