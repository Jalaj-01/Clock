const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });
}

const COMPACT_WIDTH = 186;
const COMPACT_HEIGHT = 56;
const EXPANDED_WIDTH = 250;
const EXPANDED_HEIGHT = 160;
const CORNER_MARGIN = 16;

let mainWindow = null;
let tray = null;
let dragStartWindowPos = null;
let dragStartMousePos = null;
let snappingTimer = null;

const storePath = path.join(app.getPath('userData'), 'flip-clock-state.json');

function readStore() {
  try {
    if (fs.existsSync(storePath)) {
      const data = fs.readFileSync(storePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read store:', err);
  }
  return {};
}

function writeStore(data) {
  try {
    const existing = readStore();
    const updated = { ...existing, ...data };
    fs.writeFileSync(storePath, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write store:', err);
  }
}

function getDisplayForWindow(win) {
  if (!win || win.isDestroyed()) return screen.getPrimaryDisplay();
  const bounds = win.getBounds();
  const center = {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2),
  };
  return screen.getDisplayNearestPoint(center);
}

function getCornersForDisplay(display, winWidth, winHeight, margin = CORNER_MARGIN) {
  const { x, y, width, height } = display.workArea;
  return [
    { name: 'top-left', x: x + margin, y: y + margin },
    { name: 'top-right', x: x + width - winWidth - margin, y: y + margin },
    { name: 'bottom-left', x: x + margin, y: y + height - winHeight - margin },
    { name: 'bottom-right', x: x + width - winWidth - margin, y: y + height - winHeight - margin },
  ];
}

function getNearestCorner(win) {
  const bounds = win.getBounds();
  const display = getDisplayForWindow(win);
  const corners = getCornersForDisplay(display, bounds.width, bounds.height);

  let nearest = corners[0];
  let minDistance = Infinity;

  for (const corner of corners) {
    const dx = bounds.x - corner.x;
    const dy = bounds.y - corner.y;
    const dist = Math.hypot(dx, dy);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = corner;
    }
  }

  return { corner: nearest, displayId: display.id };
}

function snapToNearestCorner(win, duration = 160) {
  if (!win || win.isDestroyed()) return;

  if (snappingTimer) {
    clearInterval(snappingTimer);
    snappingTimer = null;
  }

  const bounds = win.getBounds();
  const store = readStore();
  const isExp = Boolean(store.isExpanded);
  const targetWidth = isExp ? EXPANDED_WIDTH : COMPACT_WIDTH;
  const targetHeight = isExp ? EXPANDED_HEIGHT : COMPACT_HEIGHT;

  const { corner, displayId } = getNearestCorner(win);
  const startX = bounds.x;
  const startY = bounds.y;
  const targetX = Math.round(corner.x);
  const targetY = Math.round(corner.y);

  writeStore({ lastCorner: corner.name, lastDisplayId: displayId });

  if (duration <= 0 || (startX === targetX && startY === targetY)) {
    win.setBounds({ x: targetX, y: targetY, width: targetWidth, height: targetHeight });
    return;
  }

  const startTime = Date.now();
  snappingTimer = setInterval(() => {
    if (!win || win.isDestroyed()) {
      clearInterval(snappingTimer);
      snappingTimer = null;
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth cubic ease-out
    const ease = 1 - Math.pow(1 - progress, 3);

    const curX = Math.round(startX + (targetX - startX) * ease);
    const curY = Math.round(startY + (targetY - startY) * ease);
    win.setBounds({ x: curX, y: curY, width: targetWidth, height: targetHeight });

    if (progress >= 1) {
      clearInterval(snappingTimer);
      snappingTimer = null;
      win.setBounds({ x: targetX, y: targetY, width: targetWidth, height: targetHeight });
    }
  }, 10);
}

function getInitialPosition(width, height) {
  const store = readStore();
  let targetDisplay = null;

  if (store.lastDisplayId) {
    const displays = screen.getAllDisplays();
    targetDisplay = displays.find((d) => d.id === store.lastDisplayId);
  }
  if (!targetDisplay) {
    targetDisplay = screen.getPrimaryDisplay();
  }

  const corners = getCornersForDisplay(targetDisplay, width, height);
  const targetCornerName = store.lastCorner || 'top-right';
  const corner = corners.find((c) => c.name === targetCornerName) || corners[1]; // default top-right

  return {
    x: Math.round(corner.x),
    y: Math.round(corner.y),
  };
}

function createWindow() {
  const store = readStore();
  const isExpanded = Boolean(store.isExpanded);
  const currentWidth = isExpanded ? EXPANDED_WIDTH : COMPACT_WIDTH;
  const currentHeight = isExpanded ? EXPANDED_HEIGHT : COMPACT_HEIGHT;
  const initialPos = getInitialPosition(currentWidth, currentHeight);

  mainWindow = new BrowserWindow({
    width: currentWidth,
    height: currentHeight,
    x: initialPos.x,
    y: initialPos.y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    thickFrame: false,
    minimizable: true,
    skipTaskbar: true,
    hasShadow: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Keep on top of all windows
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle display changes (monitor resolution, add, remove)
  screen.on('display-metrics-changed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      snapToNearestCorner(mainWindow, 0);
    }
  });

  screen.on('display-removed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      snapToNearestCorner(mainWindow, 0);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('window:close', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  if (mainWindow) {
    mainWindow.close();
  }
  app.quit();
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('window:show', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return true;
  }
  return false;
});

ipcMain.on('window:drag-start', (event, coords) => {
  if (!mainWindow) return;
  dragStartWindowPos = mainWindow.getPosition();
  dragStartMousePos = coords;
});

ipcMain.on('window:drag-move', (event, coords) => {
  if (!mainWindow || !dragStartWindowPos || !dragStartMousePos) return;
  const deltaX = coords.screenX - dragStartMousePos.screenX;
  const deltaY = coords.screenY - dragStartMousePos.screenY;
  const bounds = mainWindow.getBounds();
  mainWindow.setBounds({
    x: Math.round(dragStartWindowPos[0] + deltaX),
    y: Math.round(dragStartWindowPos[1] + deltaY),
    width: bounds.width,
    height: bounds.height,
  });
});

ipcMain.on('window:drag-end', () => {
  dragStartWindowPos = null;
  dragStartMousePos = null;
  if (mainWindow) {
    snapToNearestCorner(mainWindow, 160);
  }
});

ipcMain.handle('window:set-expanded', (event, expanded) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  const isExpanded = Boolean(expanded);
  const targetWidth = isExpanded ? EXPANDED_WIDTH : COMPACT_WIDTH;
  const targetHeight = isExpanded ? EXPANDED_HEIGHT : COMPACT_HEIGHT;

  const display = getDisplayForWindow(mainWindow);
  const { corner } = getNearestCorner(mainWindow);
  const corners = getCornersForDisplay(display, targetWidth, targetHeight);
  const targetCorner = corners.find((c) => c.name === corner.name) || corners[1];

  mainWindow.setResizable(true);
  mainWindow.setBounds({
    x: Math.round(targetCorner.x),
    y: Math.round(targetCorner.y),
    width: targetWidth,
    height: targetHeight,
  });
  mainWindow.setResizable(false);

  writeStore({ isExpanded, lastCorner: targetCorner.name, lastDisplayId: display.id });
  return isExpanded;
});

ipcMain.handle('window:is-expanded', () => {
  const store = readStore();
  return Boolean(store.isExpanded);
});

ipcMain.handle('window:snap-to-corner', (event, cornerName) => {
  if (!mainWindow) return false;
  const bounds = mainWindow.getBounds();
  const display = getDisplayForWindow(mainWindow);
  const corners = getCornersForDisplay(display, bounds.width, bounds.height);
  const target = corners.find((c) => c.name === cornerName);
  if (target) {
    mainWindow.setPosition(Math.round(target.x), Math.round(target.y));
    writeStore({ lastCorner: target.name, lastDisplayId: display.id });
    return true;
  }
  return false;
});

ipcMain.handle('settings:get-startup', () => {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (err) {
    console.error('Failed to get startup settings:', err);
    return false;
  }
});

ipcMain.handle('settings:set-startup', (event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      path: process.execPath,
    });
    return true;
  } catch (err) {
    console.error('Failed to set startup settings:', err);
    return false;
  }
});

ipcMain.handle('data:load', () => {
  return readStore();
});

ipcMain.handle('data:save', (event, data) => {
  writeStore(data);
  return true;
});

ipcMain.handle('app:is-packaged', () => {
  return app.isPackaged;
});

function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, '../build/icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
  } catch (err) {
    console.error('Failed to create tray icon:', err);
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Flip Clock - Minimal Desktop Widget');

  const updateMenu = () => {
    const isVisible = mainWindow && mainWindow.isVisible();
    const isAlwaysOnTop = mainWindow ? mainWindow.isAlwaysOnTop() : true;
    const store = readStore();
    const currentMode = store.mode || 'clock';

    const menu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide Clock' : 'Show Clock',
        click: () => {
          if (!mainWindow) return;
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
          updateMenu();
        },
      },
      {
        label: store.isExpanded ? 'Switch to Compact View' : 'Switch to Expanded View',
        click: () => {
          const targetExp = !store.isExpanded;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app:set-expanded', targetExp);
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Mode: Live Clock',
        type: 'radio',
        checked: currentMode === 'clock',
        click: () => {
          writeStore({ mode: 'clock' });
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app:set-mode', 'clock');
          }
        },
      },
      {
        label: 'Mode: Timer',
        type: 'radio',
        checked: currentMode === 'timer',
        click: () => {
          writeStore({ mode: 'timer' });
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app:set-mode', 'timer');
          }
        },
      },
      {
        label: 'Mode: Work Tracker',
        type: 'radio',
        checked: currentMode === 'work',
        click: () => {
          writeStore({ mode: 'work' });
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app:set-mode', 'work');
          }
        },
      },
      {
        label: 'Mode: Alarm',
        type: 'radio',
        checked: currentMode === 'alarm',
        click: () => {
          writeStore({ mode: 'alarm' });
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app:set-mode', 'alarm');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: isAlwaysOnTop,
        click: (menuItem) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setAlwaysOnTop(menuItem.checked, 'screen-saver');
          }
        },
      },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          try {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
              path: process.execPath,
            });
          } catch (err) {
            console.error('Failed to set startup settings:', err);
          }
        },
      },
      {
        label: 'Reset Position (Top-Right)',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            const display = getDisplayForWindow(mainWindow);
            const bounds = mainWindow.getBounds();
            const corners = getCornersForDisplay(display, bounds.width, bounds.height);
            const tr = corners.find((c) => c.name === 'top-right') || corners[1];
            mainWindow.setPosition(Math.round(tr.x), Math.round(tr.y));
            writeStore({ lastCorner: 'top-right', lastDisplayId: display.id });
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Flip Clock',
        click: () => {
          if (tray) {
            tray.destroy();
            tray = null;
          }
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(menu);
  };

  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    updateMenu();
  });

  tray.on('double-click', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
    updateMenu();
  });

  tray.on('right-click', () => {
    updateMenu();
  });

  updateMenu();
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('before-quit', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
