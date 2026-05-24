const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  
  // Register global shortcut settings
  registerGlobalPttShortcut: (key) => ipcRenderer.send('register-ptt-shortcut', key),
  unregisterGlobalPttShortcut: () => ipcRenderer.send('unregister-ptt-shortcut'),
  registerGlobalMuteShortcut: (key) => ipcRenderer.send('register-mute-shortcut', key),
  
  // Listeners for global keyboard shortcuts
  onGlobalPttChange: (callback) => {
    const subscription = (event, pressed) => callback(pressed);
    ipcRenderer.on('global-ptt-change', subscription);
    return () => ipcRenderer.removeListener('global-ptt-change', subscription);
  },
  
  onGlobalMuteToggle: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('global-mute-toggle', subscription);
    return () => ipcRenderer.removeListener('global-mute-toggle', subscription);
  },

  // Setup options (Tray, Startup, Hardware Acceleration)
  updateLauncherSettings: (settings) => ipcRenderer.send('update-launcher-settings', settings),
  getLauncherSettings: () => ipcRenderer.invoke('get-launcher-settings'),
  
  // Transparent Overlay settings
  setTransparentOverlayActive: (active) => ipcRenderer.send('set-transparent-overlay-active', active),
  sendOverlayPlayers: (players) => ipcRenderer.send('send-overlay-players', players),
  onOverlayPlayersUpdate: (callback) => {
    const subscription = (event, players) => callback(players);
    ipcRenderer.on('overlay-players-update', subscription);
    return () => ipcRenderer.removeListener('overlay-players-update', subscription);
  },
  
  // Custom Window Controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  onMaximizeStatusChange: (callback) => {
    const subscription = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximize-status', subscription);
    return () => ipcRenderer.removeListener('window-maximize-status', subscription);
  },
  
  // Native Game Detection & Rich Presence
  updateRichPresence: (gameName) => ipcRenderer.send('update-rich-presence', gameName),
  onGameDetected: (callback) => {
    const subscription = (event, game) => callback(game);
    ipcRenderer.on('native-game-detected', subscription);
    return () => ipcRenderer.removeListener('native-game-detected', subscription);
  },

  // Custom Tray notifications / states
  setVoiceStatus: (status) => ipcRenderer.send('set-voice-status', status),
  
  // Relaunch utility or quit
  quitApp: () => ipcRenderer.send('quit-app')
});
