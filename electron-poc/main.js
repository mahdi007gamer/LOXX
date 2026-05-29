const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Setup logging directory and file path
const userDataPath = app.getPath('userData');
const logDir = path.join(userDataPath, 'Logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'updater.log');

// Define a unified logging helper
function logMsg(level, ...args) {
  const time = new Date().toISOString();
  const text = `[${time}] [${level}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
  try {
    fs.appendFileSync(logFile, text + '\r\n');
  } catch (err) {
    // silently fail
  }
  console.log(text);
}

// Inter-process logs
logMsg('INFO', 'Starting LOXX process sequence...');

// Dynamic Application Icon Resolving
let appIconPath = null;
const iconSearchPaths = [
  path.join(__dirname, 'build', 'logo.png'),
  path.join(__dirname, 'build', 'icon.ico'),
  path.join(__dirname, 'logo.png'),
  path.join(__dirname, '..', 'public', 'logo.png')
];
for (const p of iconSearchPaths) {
  if (fs.existsSync(p)) {
    appIconPath = p;
    logMsg('INFO', `Custom application icon resolved at: ${p}`);
    break;
  }
}
if (!appIconPath) {
  logMsg('WARN', 'No custom application icon found on disk. Resorting to standard system defaults.');
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logMsg('WARN', 'Another instance of LOXX is already running. Quitting.');
  app.quit();
} else {
  // Set App User Model ID for Windows Taskbar & Notifications
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.isPackaged ? 'ir.loxx.launcher' : process.execPath);
    
    // Create/Truncate log file for clean troubleshooting diagnostics silently without launching PowerShell
    const startBanner = `[${new Date().toISOString()}] [INFO] ===================================================\r\n` +
                        `[${new Date().toISOString()}] [INFO]     LOXX CLIENT LIFECYCLE MONITOR ACTIVE\r\n` +
                        `[${new Date().toISOString()}] [INFO]     Version: ${app.getVersion()}\r\n` +
                        `[${new Date().toISOString()}] [INFO]     Executable: ${process.execPath}\r\n` +
                        `[${new Date().toISOString()}] [INFO]     User Data Path: ${userDataPath}\r\n` +
                        `[${new Date().toISOString()}] [INFO]     Log File: ${logFile}\r\n` +
                        `[${new Date().toISOString()}] [INFO] ===================================================\r\n`;
    try {
      fs.writeFileSync(logFile, startBanner, 'utf8');
      logMsg('INFO', 'Initialized silent diagnostics lifecycle log targets.');
    } catch (err) {
      console.error('Failed to initialize session event log format:', err);
    }
  }

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    logMsg('INFO', 'Detected second instance launch attempt. Focusing primary app window.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Redirect electron-updater default logs to our file
autoUpdater.logger = {
  info: (msg) => logMsg('INFO_UPDATER', msg),
  warn: (msg) => logMsg('WARN_UPDATER', msg),
  error: (msg) => logMsg('ERROR_UPDATER', msg)
};

// Configure autoUpdater settings
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false; // Disable automatic installer launch on app quit to prevent lock conflicts
autoUpdater.disableDifferentialDownload = false; // Enable blockmap block-matching differential download to fetch only modified chunks (reduces download from 76MB to ~1.3MB)

// Disable & bypass code signing verification checks for development/unsigned releases on Windows and MacOS
autoUpdater.verifySignature = async function(tempUpdateFile) {
  logMsg('INFO_UPDATER', `Bypassed digital code signing verification check successfully for temp update file: ${tempUpdateFile}`);
  return null;
};
if (autoUpdater.constructor && autoUpdater.constructor.prototype) {
  autoUpdater.constructor.prototype.verifySignature = async function(tempUpdateFile) {
    logMsg('INFO_UPDATER', `Bypassed prototype digital code signing verification check successfully for temp update file: ${tempUpdateFile}`);
    return null;
  };
}

try {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://loxx.ir/updater/'
  });
  logMsg('INFO', 'Configuring updater feed target to: https://loxx.ir/updater/');
} catch (feedErr) {
  logMsg('ERROR', 'Failed to configure AutoUpdater Feed URL:', feedErr);
}

// Auto-updater events
autoUpdater.on('error', (err) => {
  logMsg('ERROR', 'Updater failed with error structure:', err);
  sendUpdateStatus('error', 100);
  setTimeout(() => {
    launchMainWindow();
  }, 1200);
});

autoUpdater.on('checking-for-update', () => {
  logMsg('INFO', 'Checking for update packages on remote feed...');
  sendUpdateStatus('checking', 25);
});

autoUpdater.on('update-available', (info) => {
  logMsg('INFO', `New package version ${info.version} is available. Initiating automatic background download...`);
  if (typeof updateCheckTimeout !== 'undefined') {
    clearTimeout(updateCheckTimeout);
  }
  global.isUpdateDownloading = true;
  sendUpdateStatus('downloading', 45);
});

autoUpdater.on('update-not-available', (info) => {
  logMsg('INFO', `Platform is fully up-to-date. Current version: ${app.getVersion()}. Launching LOXX UI.`);
  sendUpdateStatus('not-available', 100);
  setTimeout(() => {
    launchMainWindow();
  }, 1000);
});

autoUpdater.on('download-progress', (progressObj) => {
  logMsg('INFO', `Downloading package chunk: Progress ${Math.round(progressObj.percent)}% - Speed: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`);
  sendUpdateStatus('downloading', Math.round(progressObj.percent));
});

autoUpdater.on('update-downloaded', (info) => {
  logMsg('INFO', `--- UPDATE PACKAGE DOWNLOAD COMPLETE ---`);
  logMsg('INFO', `Downloaded version details:`, info);
  sendUpdateStatus('ready', 100);
  
  // Launch seamless background automatic update & restart without a dialog prompt
  logMsg('INFO', 'Automatic background install sequence initiated. Commencing forceful process shutdown sequences...');
  isQuitting = true;
  
  // Safely destroy system tray to release resource handles
  if (tray) {
    try {
      logMsg('INFO', 'Destroying system tray object references...');
      tray.destroy();
      tray = null;
    } catch (e) {
      logMsg('ERROR', 'Failed during system tray destruction:', e);
    }
  }

  // Crucial: Detach standard 'window-all-closed' lifecycle handler so it doesn't interrupt the transition
  logMsg('INFO', 'Deregistering general close listeners...');
  app.removeAllListeners('window-all-closed');
  app.on('window-all-closed', () => {
    logMsg('INFO', 'Inhibited automatic app.quit on window closing to delegate control to autoUpdater.');
  });

  // Close and destroy all standard render windows to release all dynamic file handles
  logMsg('INFO', 'Destroying all active Electron BrowserWindow objects...');
  BrowserWindow.getAllWindows().forEach((win) => {
    try {
      if (!win.isDestroyed()) {
        logMsg('INFO', `Closing window instance: ${win.getTitle()}`);
        win.destroy();
      }
    } catch (e) {
      logMsg('ERROR', 'Error encountered during window force shutdown:', e);
    }
  });

  // Wait exactly 1.5 seconds to guarantee OS level release of files, DLL locks, and child processes
  logMsg('INFO', 'Waiting for file locks to clear (grace-period active: 1500ms)...');
  setTimeout(() => {
    try {
      logMsg('INFO', 'Invoking installer execute sequence: autoUpdater.quitAndInstall(isSilent=false, isForceRunAfter=true)...');
      // By using isSilent = false, we run with normal UI which requests UAC beautifully and avoids silent Windows blocks
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      logMsg('ERROR', 'Severe failure during quitAndInstall invoke. Attempting application quit fallback:', err);
      app.quit();
    }
  }, 1500);
});

// Append switches to prevent background throttling of voice context & keys
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitting = false;

function sendUpdateStatus(status, percent) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('update-status', status, percent);
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 450,
    height: 450,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    icon: appIconPath || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    // Inject correct absolute image URL from Node context into the splash screen to avoid relative path resolution bugs
    let logoPath = path.join(__dirname, 'build', 'logo.png').replace(/\\/g, '/');
    let fallbackPath = path.join(__dirname, '..', 'public', 'logo.png').replace(/\\/g, '/');
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.executeJavaScript(`
        try {
          let img = document.querySelector('.logo-image');
          if (img) {
            img.src = "file:///${logoPath}";
            img.onerror = () => { img.src = "file:///${fallbackPath}"; };
          }
        } catch(e) {}
      `);
      splashWindow.show();
    }
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

let isMainAppLaunched = false;
function launchMainWindow() {
  if (isMainAppLaunched) return;
  isMainAppLaunched = true;

  createMainWindow();

  if (mainWindow) {
    mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      }, 1500);
    });
  }
}

// Default client configuration
const configPath = path.join(app.getPath('userData'), 'loxx-config.json');
let config = {
  closeToTray: true,
  startAtLogin: true,
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
  if (!gotTheLock) return;
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'LOXX',
    show: false, // Solid background loaded first under splash
    icon: appIconPath || undefined,
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

  // Handle redundant graceful fallback shows
  mainWindow.once('ready-to-show', () => {
    if (!splashWindow) {
      mainWindow.show();
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
  mainWindow.loadURL('https://loxx.ir/#/dashboard');

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
    let trayIcon = null;

    // List of probable paths for the tray icon across development and packaged versions
    const pathsToSearch = [];
    if (appIconPath) pathsToSearch.push(appIconPath);
    pathsToSearch.push(
      path.join(__dirname, 'assets', 'tray.png'),     // Best practice: Subfolder assets/
      path.join(__dirname, 'tray.png'),               // Fallback: Root folder
      path.join(__dirname, 'build', 'tray.png'),       // Dev mode fallback
      path.join(__dirname, 'build', 'icon.ico'),       // Installer source fallback
      path.join(__dirname, '../public/logo_square.png') // Web client resource fallback
    );

    for (const imgPath of pathsToSearch) {
      if (fs.existsSync(imgPath)) {
        trayIcon = nativeImage.createFromPath(imgPath);
        break;
      }
    }

    // Default to in-memory Base64 ring icon if no image file is found
    if (!trayIcon || trayIcon.isEmpty()) {
      const iconBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmklEQVQ4T2NkoBAwUqifaXSDgYGBgYGRgYFB8p8P778DxfYxwEX/7WbYgG6CAn6LgQEo6E0MDHBhFAH0m8NMoZ99VvD+AwMjI8P/78An6P8bL4wNMMAMIs0IDYVAsQUY/v8HCjH8Xz0fWRCYIsD0b8hM2N8HbyD+/g0pDky9Iclh/6mI9B/YUPC9vR2YfR79IUEfHhI2jOIAAP2YIcsF8+5gAAAAAElFTkSuQmCC',
        'base64'
      );
      trayIcon = nativeImage.createFromBuffer(iconBuffer);
    }
    
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    
    // Auxiliary helper to generate dynamic interactive tray options inside runtime
    const rebuildTrayMenu = () => {
      if (!tray) return;
      const contextMenu = Menu.buildFromTemplate([
        { label: 'لوکس | Loxx Client', enabled: false },
        { label: `نسخه ${app.getVersion()}`, enabled: false },
        { type: 'separator' },
        { 
          label: 'نمایش پنجره اصلی لوکس', 
          click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } 
        },
        { 
          label: 'پنهان کردن پنجره', 
          click: () => { if (mainWindow) { mainWindow.hide(); } } 
        },
        { type: 'separator' },
        { 
          label: 'غیرفعال‌سازی موقت میکروفون (Global Mute)', 
          click: () => { if (mainWindow) mainWindow.webContents.send('global-mute-toggle'); } 
        },
        { type: 'separator' },
        { 
          label: 'اجرا همزمان با شروع ویندوز (Autostart)', 
          type: 'checkbox',
          checked: config.startAtLogin,
          click: (menuItem) => {
            config.startAtLogin = menuItem.checked;
            saveConfig();
            applyStartupSetting();
            rebuildTrayMenu();
          }
        },
        { 
          label: 'خروج از برنامه با دکمه بستن (Close to Tray)', 
          type: 'checkbox',
          checked: config.closeToTray,
          click: (menuItem) => {
            config.closeToTray = menuItem.checked;
            saveConfig();
            rebuildTrayMenu();
          }
        },
        { 
          label: 'شتاب‌دهنده سخت‌افزاری گرافیک (GPU)', 
          type: 'checkbox',
          checked: config.hardwareAcceleration,
          click: (menuItem) => {
            config.hardwareAcceleration = menuItem.checked;
            saveConfig();
            dialog.showMessageBox({
              type: 'info',
              title: 'سامانه شتاب‌دهنده گرافیکی',
              message: 'تغییر وضعیت شتاب‌دهنده گرافیکی نیاز به راه‌اندازی مجدد لوکس دارد.',
              buttons: ['متوجه شدم']
            });
            rebuildTrayMenu();
          }
        },
        { type: 'separator' },
        { 
          label: 'بررسی بروزرسانی نسخه لوکس (Check for Update)', 
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'جستجوی بروزرسانی لوکس',
              message: 'جستجو برای نسخه جدید لوکس در پس‌زمینه آغاز شد. در صورت وجود، نسخه جدید دانلود و آماده نصب می‌شود.',
              buttons: ['تایید']
            });
            try {
              autoUpdater.checkForUpdatesAndNotify();
            } catch (err) {
              console.error('Manual update check failed:', err);
            }
          } 
        },
        { 
          label: 'بارگذاری مجدد صفحه اصلی (Reload Client)', 
          click: () => { if (mainWindow) mainWindow.reload(); } 
        },
        { type: 'separator' },
        { 
          label: 'خروج کامل از لوکس (Quit)', 
          click: () => { isQuitting = true; app.quit(); } 
        }
      ]);
      tray.setContextMenu(contextMenu);
    };

    rebuildTrayMenu();
    tray.setToolTip('Loxx Client');

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

  // 3. Overlay Interaction Toggle
  try {
    globalShortcut.register('Alt+F1', () => {
      // Must be defined somewhere accessible, will fix toggle function ref
      if (typeof global.toggleOverlayInteraction === 'function') {
        global.toggleOverlayInteraction();
      }
    });
  } catch (e) {
    console.warn('Error registering Alt+F1 shortcut:', e);
  }
}


app.whenReady().then(() => {
  if (!gotTheLock) {
    app.quit();
    return;
  }

  createSplashWindow();
  setupTray();
  applyStartupSetting();
  registerGlobalShortcuts();

  // Handle get-app-version IPC handler
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

let isUpdateDownloading = false;
let updateCheckTimeout;

if (app.isPackaged) {
  console.log('Production mode: Initiating silent background update check...');
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.warn('Background update check failed to start:', err);
    launchMainWindow();
  }
} else {
  // In development mode, mock update search on splash, then load main
  setTimeout(() => {
    sendUpdateStatus('checking', 35);
    setTimeout(() => {
      sendUpdateStatus('not-available', 100);
      setTimeout(() => {
        launchMainWindow();
      }, 1000);
    }, 1000);
  }, 500);
}

// Safe fallback to prevent freeze under any network / updater failures
updateCheckTimeout = setTimeout(() => {
  if (!global.isUpdateDownloading) {
    launchMainWindow();
  }
}, 7000);


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

  global.toggleOverlayInteraction = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    isOverlayInteractive = !isOverlayInteractive;
    if (isOverlayInteractive) {
      overlayWindow.setIgnoreMouseEvents(false);
      overlayWindow.setOpacity(1.0); // Make the entire window solid of high-readability in focus mode
      overlayWindow.focus();
      overlayWindow.webContents.send('overlay-interaction-mode', true);
    } else {
      let clickThrough = config.overlayClickThrough !== false;
      overlayWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
      overlayWindow.setOpacity(Number(config.overlayOpacity !== undefined ? config.overlayOpacity : 0.9)); // Restore to beautiful transparent HUD opacity
      overlayWindow.webContents.send('overlay-interaction-mode', false);
    }
  };

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
        overlayWindow.loadURL(`${baseURL}/#/overlay?is_overlay_window=true`);
        
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
      if (typeof global.toggleOverlayInteraction === 'function') {
        global.toggleOverlayInteraction();
      }
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

  // LAN Bridge Connection and Signal Mapping
  const lanBridge = require('./lan-bridge.js');

  lanBridge.setLogger((level, ...args) => {
    logMsg(level, '[LAN]', ...args);
  });

  lanBridge.on('packet-broadcast', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-packet-captured', data);
    }
  });

  lanBridge.on('tcp-connect', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-tcp-connect-req', data);
    }
  });

  lanBridge.on('tcp-data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-tcp-data', data);
    }
  });

  lanBridge.on('tcp-close', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-tcp-close-req', data);
    }
  });

  lanBridge.on('udp-data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-udp-data', data);
    }
  });

  lanBridge.on('lan-status', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-status-change', data);
    }
  });

  lanBridge.on('lan-error', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lan-error-occurred', data);
    }
  });

  ipcMain.on('start-lan-relay', (event, { role, lobbyId, customPorts }) => {
    lanBridge.start(role, lobbyId, customPorts);
  });

  ipcMain.on('stop-lan-relay', () => {
    lanBridge.stopAndCleanup();
  });

  ipcMain.on('inject-lan-udp-packet', (event, { port, data }) => {
    lanBridge.injectUdpPacket(port, data);
  });

  ipcMain.on('remote-tcp-connect', (event, { connectionId, port }) => {
    lanBridge.handleHostTcpConnect(connectionId, port);
  });

  ipcMain.on('remote-tcp-data', (event, { connectionId, data }) => {
    if (lanBridge.role === 'host') {
      lanBridge.handleHostTcpData(connectionId, data);
    } else {
      lanBridge.handleClientTcpData(connectionId, data);
    }
  });

  ipcMain.on('remote-tcp-close', (event, { connectionId }) => {
    if (lanBridge.role === 'host') {
      lanBridge.handleHostTcpClose(connectionId);
    } else {
      lanBridge.handleClientTcpClose(connectionId);
    }
  });

  ipcMain.on('remote-udp-data', (event, { connectionId, port, data, isResponse, clientAddress, clientPort }) => {
    lanBridge.handleUdpData(connectionId, port, data, isResponse, clientAddress, clientPort);
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  try {
    const lb = require('./lan-bridge.js');
    lb.stopAndCleanup();
  } catch (e) {}
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
