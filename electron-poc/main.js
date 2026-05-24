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
  globalMuteKey: 'CommandOrControl+Alt+M',
  overlayX: 24,
  overlayY: 80,
  overlayWidth: 320,
  overlayHeight: 480,
  overlayOpacity: 0.9,
  overlayClickThrough: true
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
    frame: false, // Custom styled borderless window
    thickFrame: true, // Enable native operating system shadows & smooth edge resizing
    resizable: true, // Allow custom border/edge stretching
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false // Continuous background voice/CPU execution
    }
  });

  // Provide custom User-Agent to easily identify Launcher on the server
  const defaultUA = mainWindow.webContents.getUserAgent();
  mainWindow.webContents.setUserAgent(`${defaultUA} LoxxLauncher/1.0.0`);

  // Listen for maximize / restore updates
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize-status', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximize-status', false);
  });

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
let pttTimeout = null;
let globalPttActive = false;

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();

  // 1. Push-To-Talk register
  if (config.globalPttKey) {
    try {
      globalShortcut.register(config.globalPttKey, () => {
        if (mainWindow) {
          if (mainWindow.isFocused()) {
            // When app window is focused, let React handle standard keypress events natively.
            mainWindow.webContents.send('global-ptt-change', true);
            if (pttTimeout) clearTimeout(pttTimeout);
            pttTimeout = setTimeout(() => {
              if (mainWindow) mainWindow.webContents.send('global-ptt-change', false);
            }, 600);
          } else {
            // Background / In-Game mode: Toggle speaking state with visual HUD notice so the user doesn't have to strain their finger.
            globalPttActive = !globalPttActive;
            mainWindow.webContents.send('global-ptt-change', globalPttActive);
            
            // Auto safety off after 20 seconds of silence to prevent hotmic
            if (pttTimeout) clearTimeout(pttTimeout);
            if (globalPttActive) {
              pttTimeout = setTimeout(() => {
                globalPttActive = false;
                if (mainWindow) mainWindow.webContents.send('global-ptt-change', false);
              }, 20000);
            }
          }
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
    
    // Dynamically update active overlay window dimensions/style in real-time
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      try {
        if (
          settings.overlayWidth !== undefined || 
          settings.overlayHeight !== undefined || 
          settings.overlayX !== undefined || 
          settings.overlayY !== undefined
        ) {
          overlayWindow.setBounds({
            x: Math.round(Number(config.overlayX)),
            y: Math.round(Number(config.overlayY)),
            width: Math.round(Number(config.overlayWidth)),
            height: Math.round(Number(config.overlayHeight))
          });
        }
        if (settings.overlayOpacity !== undefined) {
          overlayWindow.setOpacity(Number(config.overlayOpacity));
        }
        if (settings.overlayClickThrough !== undefined) {
          overlayWindow.setIgnoreMouseEvents(!!config.overlayClickThrough);
        }
      } catch (e) {
        console.error("Failed to dynamically update overlay properties:", e);
      }
    }

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

  // Native Window State Commands
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) {
      if (config.closeToTray && !isQuitting) {
        mainWindow.hide();
      } else {
        isQuitting = true;
        mainWindow.close();
      }
    }
  });

  // Game Overlay HUD Window Controller
  let overlayWindow = null;
  ipcMain.on('set-transparent-overlay-active', (event, active) => {
    try {
      if (active) {
        if (overlayWindow) return;
        overlayWindow = new BrowserWindow({
          width: Math.round(Number(config.overlayWidth || 300)),
          height: Math.round(Number(config.overlayHeight || 500)),
          x: Math.round(Number(config.overlayX || 24)),
          y: Math.round(Number(config.overlayY || 80)),
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          skipTaskbar: true,
          hasShadow: false,
          resizable: false,
          opacity: Number(config.overlayOpacity !== undefined ? config.overlayOpacity : 0.9),
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false // Keep rendering HUD even if game is focused
          }
        });
        
        // Make it click-through, sitting perfectly on top of any low-level screen
        overlayWindow.setIgnoreMouseEvents(!!config.overlayClickThrough);
        
        // Compute dynamic local server URL route
        let baseURL = 'https://loxx.ir';
        if (mainWindow && !mainWindow.isDestroyed()) {
          const currentURL = mainWindow.getURL();
          if (currentURL) {
            baseURL = currentURL.split('/').slice(0, 3).join('/');
          }
        }
        overlayWindow.loadURL(`${baseURL}/lobby/overlay-widget`);
        
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

  // Cross-Window Desktop Overlay Speaking Player Syncer
  ipcMain.on('send-overlay-players', (event, players) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('overlay-players-update', players);
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
