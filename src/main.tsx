import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Censor and suppress sensitive or noisy internal protocol/signaling logs from the dev/prod console
if (typeof window !== "undefined") {
  const suppressedPatterns = [
    "LOXX SFU",
    "LOXX VOICE",
    "LobbyContext:",
    "VAD | debug",
    "ScriptProcessorNode",
    "VAD-WEB",
    "silero_vad_legacy",
    "FriendChatOverlay",
    "isOverlayWidget:",
    "Mediasoup Device",
    "ort-wasm",
    "audio-worklet",
    "no available backend found"
  ];

  const checkAndLog = (originalFn: Function, args: any[]) => {
    try {
      const msgStr = args.map(arg => {
        if (typeof arg === "string") return arg;
        try { return JSON.stringify(arg); } catch { return ""; }
      }).join(" ");

      const shouldSuppress = suppressedPatterns.some(pattern => 
        msgStr.toLowerCase().includes(pattern.toLowerCase())
      );

      if (!shouldSuppress) {
        originalFn(...args);
      }
    } catch {
      originalFn(...args);
    }
  };

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  console.log = (...args) => checkAndLog(originalLog, args);
  console.warn = (...args) => checkAndLog(originalWarn, args);
  console.error = (...args) => checkAndLog(originalError, args);
  console.info = (...args) => checkAndLog(originalInfo, args);
}

// Register PWA service worker
if ('serviceWorker' in navigator) {
 const updateSW = registerSW({
 immediate: true,
 onNeedRefresh() {
 console.log('New content available!');
 // Dispatch an event holding the update function so other parts of the app can decide when to refresh
 window.dispatchEvent(new CustomEvent('app-update-available', { detail: { update: () => updateSW(true) }}));
 },
 onOfflineReady() {
 console.log('App ready to work offline');
 },
 });
}

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <App />
 </StrictMode>,
);
