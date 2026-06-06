import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

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
