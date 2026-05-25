const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Append switches to prevent background throttling of voice context & keys
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

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
    title: 'LOXX',
    icon: fs.existsSync(path.join(__dirname, '../public/logo_square.png')) 
      ? path.join(__dirname, '../public/logo_square.png') 
      : path.join(__dirname, '../public/logo.png'),
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

  // 1. Push-To-Talk register - Hold mode via timeout
  if (config.globalPttKey) {
    try {
      globalShortcut.register(config.globalPttKey, () => {
        if (mainWindow) {
          // Standard held key repeat loop
          if (!globalPttActive) {
            globalPttActive = true;
            mainWindow.webContents.send('global-ptt-change', true);
          }

          if (pttTimeout) clearTimeout(pttTimeout);

          // If no repeat triggers for 250ms, the held key has been released
          pttTimeout = setTimeout(() => {
            globalPttActive = false;
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('global-ptt-change', false);
            }
          }, 350);
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
          overlayWindow.setIgnoreMouseEvents(true, { forward: true });
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
  let isOverlayInteractive = false;

  const toggleOverlayInteraction = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    isOverlayInteractive = !isOverlayInteractive;
    if (isOverlayInteractive) {
      overlayWindow.setIgnoreMouseEvents(false);
      overlayWindow.focus();
      overlayWindow.webContents.send('overlay-interaction-mode', true);
    } else {
      let clickThrough = config.overlayClickThrough !== false;
      overlayWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
      overlayWindow.webContents.send('overlay-interaction-mode', false);
    }
  };

  globalShortcut.register('Alt+F2', toggleOverlayInteraction);

  ipcMain.on('set-transparent-overlay-active', (event, active) => {
    try {
      if (active) {
        if (overlayWindow) return;
        
        let screenWidth = 800;
        let screenHeight = 600;
        let screenX = 0;
        let screenY = 0;
        
        try {
          const primaryDisplay = screen.getPrimaryDisplay();
          if (primaryDisplay && primaryDisplay.bounds) {
            screenWidth = primaryDisplay.bounds.width;
            screenHeight = primaryDisplay.bounds.height;
            screenX = primaryDisplay.bounds.x;
            screenY = primaryDisplay.bounds.y;
          }
        } catch (screenErr) {
          console.warn("[Overlay] Failed to fetch primary display bounds:", screenErr);
        }

        isOverlayInteractive = false;

        overlayWindow = new BrowserWindow({
          width: screenWidth,
          height: screenHeight,
          x: screenX,
          y: screenY,
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          skipTaskbar: true,
          hasShadow: false,
          resizable: false,
          type: 'toolbar', // Float above normal windows
          focusable: true, // Needs focusability for interactive mode
          opacity: Number(config.overlayOpacity !== undefined ? config.overlayOpacity : 0.9),
          webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            backgroundThrottling: false // Keep rendering HUD even if game is focused
          }
        });
        
        // Elevate display priority band to top tier screen-saver layer
        overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        overlayWindow.setVisibleOnAllWorkspaces(true);
        overlayWindow.setFullScreenable(false);

        // Make it click-through, sitting perfectly on top of any low-level screen
        let clickThrough = config.overlayClickThrough !== false;
        overlayWindow.setIgnoreMouseEvents(true, { forward: clickThrough });
        
        // Compute dynamic local server URL route
        let baseURL = 'https://loxx.ir';
        if (mainWindow && !mainWindow.isDestroyed()) {
          const currentURL = mainWindow.getURL();
          if (currentURL) {
            baseURL = currentURL.split('/').slice(0, 3).join('/');
          }
        }
        overlayWindow.loadURL(`${baseURL}/#/overlay`);
        
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
  let lastOverlayPlayers = [];
  ipcMain.on('send-overlay-players', (event, players) => {
    lastOverlayPlayers = players;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('overlay-players-update', players);
    }
  });

  ipcMain.handle('get-overlay-players', () => {
    return lastOverlayPlayers;
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

  // Native Game Process Detector Service
  // Scans background process checking for all active windows to dynamically detect games
  const { exec } = require('child_process');
  
  // Experimental DirectX / Vulkan Graphic Hook Injector Wrapper (PoC)
  // In a production environment, this would call a compiled C++ Node-addon (.node DLL)
  class NativeGraphicInjector {
    static injectOverlay(processName, windowTitle) {
      console.log(`[DirectX/Vulkan Injector] Preparing hooks for ${processName} (${windowTitle})...`);
      // Fallback to Native transparent bounds positioning:
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        console.log(`[DirectX/Vulkan Injector] Firing native overlay bridge to hover on Z-Band 1 above ${processName}`);
        overlayWindow.setAlwaysOnTop(true, 'screen-saver', 2);
      }
    }
    
    static detach() {
       console.log(`[DirectX/Vulkan Injector] Detaching graphics hooks...`);
    }
  }

  let gameScanInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Using PowerShell to get processes with visible windows, filtering out common system bounds
      const psCommand = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -notmatch 'chrome|edge|firefox|explorer|code|discord|HostProcess|Calculator|devenv|Taskmgr|loxx|electron|notepad|cmd|conhost|pwsh|powershell|SystemSettings|TextInputHost|ApplicationFrameHost|SearchHost|StartMenuExperienceHost|idea64|Code|Cursor' } | Select-Object ProcessName, MainWindowTitle | ConvertTo-Json -Compress`;
      
      exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, { windowsHide: true, encoding: 'utf8' }, (err, stdout, stderr) => {
        if (err || !stdout) return;
        try {
          let processes = JSON.parse(stdout);
          if (!Array.isArray(processes)) processes = [processes];
          
          let detectedGame = null;
          // Filter common windows and generic titles to find the "Game"
          const ignoreTitles = ["Settings", "Microsoft Text Input Application", "Program Manager"];
          
          let detectedGameProcess = null;

          for (const proc of processes) {
             if (proc.MainWindowTitle && proc.MainWindowTitle.trim() !== "" && !ignoreTitles.includes(proc.MainWindowTitle)) {
                 // Assume the most prominent heavy localized fullscreen app as the game
                 detectedGame = proc.MainWindowTitle.trim();
                 detectedGameProcess = proc.ProcessName;
                 break;
             }
          }
          
          if (detectedGame && detectedGame !== richPresenceGame) {
             NativeGraphicInjector.injectOverlay(detectedGameProcess, detectedGame);
          } else if (!detectedGame && richPresenceGame) {
             NativeGraphicInjector.detach();
          }

          mainWindow.webContents.send('native-game-detected', detectedGame);
        } catch (parseErr) {
          // ignore parse err
        }
      });
    }
  }, 10000); // Check every 10 seconds

  // Handle Resource Throttling dynamically based on Game Detection
  ipcMain.on('native-game-detected-reply', (event, isPlayingHeavyGame) => {
    if (config.throttleGameMode) {
      if (isPlayingHeavyGame) {
        if (mainWindow && !mainWindow.isDestroyed()) {
           mainWindow.webContents.setBackgroundThrottling(true);
        }
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
           mainWindow.webContents.setBackgroundThrottling(false);
        }
      }
    }
  });

  // Handle actions sent from Overlay to Main Window
  ipcMain.on('overlay-action', (event, action) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('overlay-action-to-main', action);
      try {
        mainWindow.show();
        mainWindow.focus();
      } catch (err) {
        console.error("Failed to show/focus main window on action:", err);
      }
    }
    // Automatically turn off overlay interactive mode on action to hide/reset Alt+F2 state
    if (isOverlayInteractive) {
      toggleOverlayInteraction();
    }
  });

  // Handle navigation requests from overlay window to main window
  ipcMain.on('navigate-main-window', (event, pathStr) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      let baseURL = 'https://loxx.ir';
      try {
        const currentURL = mainWindow.getURL();
        if (currentURL) {
          baseURL = currentURL.split('/').slice(0, 3).join('/');
        }
      } catch (e) {
        console.error("Failed to parse main window URL:", e);
      }
      
      const targetURL = `${baseURL}${pathStr}`;
      mainWindow.loadURL(targetURL);
      mainWindow.show();
      mainWindow.focus();
    }
  });

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
