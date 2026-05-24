const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Default client configuration
const configPath = path.join(app.getPath('userData'), 'loxx-config.json');
let config = {
  closeToTray: true,
  startAtLogin: false,
  hardwareAcceleration: true,
  globalPttKey: 'CommandOrControl+Alt+V',
  globalMuteKey: 'CommandOrControl+Alt+M'
};

// Load persistent configurations
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...saved };
    }
  } catch (e) {
    console.error('Failed to load loxx-config.json:', e);
  }
}

// Save persistent configurations
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save loxx-config.json:', e);
  }
}

// Apply startup setting
function applyStartupSetting() {
  try {
    app.setLoginItemSettings({
      openAtLogin: config.startAtLogin,
      path: app.getPath('exe')
    });
  } catch (e) {
    console.warn('Startup setting application failed:', e);
  }
}

// Load config before app is ready to configure hardware acceleration
loadConfig();
if (!config.hardwareAcceleration) {
  app.disableHardwareAcceleration();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'Loxx Web',
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // Provide custom User-Agent to easily identify Launcher on the server
  const defaultUA = mainWindow.webContents.getUserAgent();
  mainWindow.webContents.setUserAgent(`${defaultUA} LoxxLauncher/1.0.0`);

  // Load production application
  mainWindow.loadURL('https://loxx.ir/dashboard');

  // Handle Close event (Close to System Tray)
  mainWindow.on('close', (event) => {
    if (config.closeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup task system tray standard icon layout
function setupTray() {
  try {
    // Generate an in-memory 16x16 icon to avoid broken paths inside bundles
    // A fully functional crisp green/blue indicator ring
    const iconBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmklEQVQ4T2NkoBAwUqifaXSDgYGBgYGRgYFB8p8P778DxfYxwEX/7WbYgG6CAn6LgQEo6E0MDHBhFAH0m8NMoZ99VvD+AwMjI8P/78An6P8bL4wNMMAMIs0IDYVAsQUY/v8HCjH8Xz0fWRCYIsD0b8hM2N8HbyD+/g0pDky9Iclh/6mI9B/YUPC9vR2YfR79IUEfHhI2jOIAAP2YIcsF8+5gAAAAAElFTkSuQmCC',
      'base64'
    );
    const trayIcon = nativeImage.createFromBuffer(iconBuffer);
    
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Loxx Web Launcher v1.0', enabled: false },
      { type: 'separator' },
      { label: 'نمایش برنامه (Restore Window)', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { type: 'separator' },
      { label: 'غیرفعال‌سازی موقت میکروفون (Global Mute)', click: () => { if (mainWindow) mainWindow.webContents.send('global-mute-toggle'); } },
      { type: 'separator' },
      { label: 'خروج کامل (Exit)', click: () => { isQuitting = true; app.quit(); } }
    ]);

    tray.setToolTip('Loxx Client');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.error('Failed to create tray icon:', e);
  }
}

// Global OS key listeners handling
function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();

  // 1. Push-To-Talk register
  if (config.globalPttKey) {
    try {
      // Monitor both keydown and keyup. 
      // Note: Electron's globalShortcut detects triggering of keystroke but does not natively support "keyup".
      // Therefore, professional clients use separate listeners or handle key-up on key release intervals.
      // For reliable push-to-talk in full-screen games, we capture triggering clicks or use toggles,
      // and we support registering key combos.
      globalShortcut.register(config.globalPttKey, () => {
        if (mainWindow) {
          mainWindow.webContents.send('global-ptt-change', true);
          // Auto release after 3 seconds safety margin if no refresher sent
          clearTimeout(this.pttTimeout);
          this.pttTimeout = setTimeout(() => {
            if (mainWindow) mainWindow.webContents.send('global-ptt-change', false);
          }, 450);
        }
      });
    } catch (e) {
      console.warn('Error registering global PTT shortcut:', e);
    }
  }

  // 2. Global Mic Mute Toggle registrar
  if (config.globalMuteKey) {
    try {
      globalShortcut.register(config.globalMuteKey, () => {
        if (mainWindow) {
          mainWindow.webContents.send('global-mute-toggle');
        }
      });
    } catch (e) {
      console.warn('Error registering global Mute shortcut:', e);
    }
  }
}

app.whenReady().then(() => {
  createMainWindow();
  setupTray();
  registerGlobalShortcuts();
  applyStartupSetting();

  // IPC communication handlers
  ipcMain.on('register-ptt-shortcut', (event, key) => {
    config.globalPttKey = key;
    saveConfig();
    registerGlobalShortcuts();
  });

  ipcMain.on('register-mute-shortcut', (event, key) => {
    config.globalMuteKey = key;
    saveConfig();
    registerGlobalShortcuts();
  });

  ipcMain.on('unregister-ptt-shortcut', () => {
    config.globalPttKey = '';
    saveConfig();
    registerGlobalShortcuts();
  });

  ipcMain.on('update-launcher-settings', (event, settings) => {
    config = { ...config, ...settings };
    saveConfig();
    applyStartupSetting();
    registerGlobalShortcuts();
    
    // Notify if app requires restart for hardware acceleration
    if ('hardwareAcceleration' in settings) {
      if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`console.log("Hardware acceleration change saved. Requires restart.");`);
      }
    }
  });

  ipcMain.handle('get-launcher-settings', () => {
    return config;
  });

  ipcMain.on('quit-app', () => {
    isQuitting = true;
    app.quit();
  });
  
  // Game Overlay HUD Window Controller
  let overlayWindow = null;
  ipcMain.on('set-transparent-overlay-active', (event, active) => {
    try {
      if (active) {
        if (overlayWindow) return;
        overlayWindow = new BrowserWindow({
          width: 300,
          height: 500,
          x: 24,
          y: 80,
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          skipTaskbar: true,
          hasShadow: false,
          resizable: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });
        
        // Make it click-through, sitting perfectly on top of low-level DX9/11/12 screens
        overlayWindow.setIgnoreMouseEvents(true);
        // Load the overlay HUD widget standalone URL
        overlayWindow.loadURL('https://loxx.ir/lobby/overlay-widget');
        
        overlayWindow.on('closed', () => {
          overlayWindow = null;
        });
      } else {
        if (overlayWindow) {
          overlayWindow.close();
          overlayWindow = null;
        }
      }
    } catch (e) {
      console.error("Overlay window control failed:", e);
    }
  });

  // Native Rich Presence State
  let richPresenceGame = null;
  ipcMain.on('update-rich-presence', (event, gameName) => {
    richPresenceGame = gameName;
    console.log(`[RichPresence] Playing status updated: ${gameName || 'Idle'}`);
    if (tray) {
      tray.setToolTip(`Loxx - ${gameName ? `🎮 Playing ${gameName}` : 'Online'}`);
    }
  });

  // Standalone simulated Game Process Detector Service
  // Simulates background process checking for steam/epic games
  let gameScanInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const activeGames = ["Counter-Strike 2", "Valorant", "Dota 2", "Grand Theft Auto V", "Apex Legends"];
      // Randomly mock detection with a 30% chance or remain Idle
      const shouldDetect = Math.random() < 0.35;
      const detectedGame = shouldDetect ? activeGames[Math.floor(Math.random() * activeGames.length)] : null;
      
      mainWindow.webContents.send('native-game-detected', detectedGame);
    }
  }, 18000);

  ipcMain.on('set-voice-status', (event, status) => {
    if (tray) {
      let displayStatus = 'متصل به کانال صوتی';
      if (status === 'talking') {
        displayStatus = '🟢 در حال صحبت';
      } else if (richPresenceGame) {
        displayStatus = `🎮 در حال بازی ${richPresenceGame}`;
      } else {
        displayStatus = '🔴 متصل به کانال صوتی';
      }
      tray.setToolTip(`Loxx - ${displayStatus}`);
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
