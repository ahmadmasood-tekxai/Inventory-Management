/**
 * Electron Main Process — qasim_inventory desktop app
 *
 * Responsibilities:
 *  1. Determine paths (userData, backend exe, frontend dist)
 *  2. Spawn the bundled Python/uvicorn backend as a child process
 *  3. Poll /health until the backend is ready (timeout 15s)
 *  4. Open the BrowserWindow loading the local frontend/dist/index.html
 *  5. On quit, kill the backend process cleanly (no orphaned processes)
 */

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as http from 'http';

// ─── Configuration ───────────────────────────────────────────────────────────

const BACKEND_PORT = 8756;
const BACKEND_HEALTH_TIMEOUT_MS = 20000; // 20 s — generous for first-run
const BACKEND_HEALTH_POLL_MS = 300;
const IS_DEV = !app.isPackaged;

// ─── Path Resolution ─────────────────────────────────────────────────────────

function getBackendExePath(): string {
  if (IS_DEV) {
    // Development: use backend/dist/qasim_backend.exe built by PyInstaller
    return path.join(__dirname, '..', '..', 'backend', 'dist', 'qasim_backend.exe');
  }
  // Production: electron-builder copies it to resources/backend/
  return path.join(process.resourcesPath, 'backend', 'qasim_backend.exe');
}

function getFrontendIndexPath(): string {
  if (IS_DEV) {
    // Development: use frontend/dist built by Vite
    return path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
  }
  // Production: electron-builder copies it to resources/frontend/dist/
  return path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
}

// ─── Backend Management ───────────────────────────────────────────────────────

let backendProcess: child_process.ChildProcess | null = null;

function spawnBackend(dataDir: string): void {
  const exePath = getBackendExePath();

  if (!fs.existsSync(exePath)) {
    dialog.showErrorBox(
      'Backend Not Found',
      `Could not find the backend executable:\n${exePath}\n\n` +
        'If you are a developer, run: cd backend && pyinstaller qasim_backend.spec'
    );
    app.quit();
    return;
  }

  console.log(`[main] Spawning backend: ${exePath}`);
  console.log(`[main] Data directory: ${dataDir}`);

  backendProcess = child_process.spawn(exePath, [], {
    env: {
      ...process.env,
      QASIM_DATA_DIR: dataDir,
      QASIM_PORT: String(BACKEND_PORT),
      CORS_ORIGINS: '*',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    // Detached: false — we own the process and kill it on quit
    detached: false,
  });

  backendProcess.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    console.log(`[backend stdout] ${line}`);
  });

  backendProcess.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`[backend stderr] ${line}`);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[main] Backend exited — code=${code} signal=${signal}`);
    backendProcess = null;
  });

  backendProcess.on('error', (err) => {
    console.error('[main] Failed to start backend:', err);
    dialog.showErrorBox('Backend Error', `Failed to start the backend process:\n${err.message}`);
    app.quit();
  });
}

function killBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    console.log('[main] Killing backend process…');
    try {
      // On Windows, kill() sends SIGTERM which may not work for all executables.
      // taskkill /F ensures the entire process tree is terminated.
      if (process.platform === 'win32') {
        child_process.execSync(`taskkill /PID ${backendProcess.pid} /T /F`, {
          stdio: 'ignore',
        });
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch {
      // Ignore errors — process may already be dead
    }
    backendProcess = null;
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

function waitForBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function poll(): void {
      if (Date.now() - start > BACKEND_HEALTH_TIMEOUT_MS) {
        reject(new Error(`Backend did not start within ${BACKEND_HEALTH_TIMEOUT_MS / 1000}s`));
        return;
      }

      const req = http.get(
        `http://127.0.0.1:${BACKEND_PORT}/health`,
        (res) => {
          if (res.statusCode === 200) {
            console.log('[main] Backend is healthy ✓');
            resolve();
          } else {
            setTimeout(poll, BACKEND_HEALTH_POLL_MS);
          }
        }
      );

      req.on('error', () => {
        // Connection refused — backend not ready yet
        setTimeout(poll, BACKEND_HEALTH_POLL_MS);
      });

      req.setTimeout(500, () => {
        req.destroy();
        setTimeout(poll, BACKEND_HEALTH_POLL_MS);
      });
    }

    poll();
  });
}

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const frontendPath = getFrontendIndexPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Qasim Inventory',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    backgroundColor: '#0f1117', // dark bg while page loads — no white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // MUST remain true for security
      nodeIntegration: false,   // MUST remain false for security
      webSecurity: true,
    },
    show: false, // show after ready-to-show to avoid flash
    titleBarStyle: 'default',
  });

  // Load the local frontend build
  mainWindow.loadFile(frontendPath);

  // Show window once content has rendered (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (IS_DEV) mainWindow?.webContents.openDevTools();
  });

  // Open external links in the system browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Per-user data directory — safe across installs and updates
  const userData = app.getPath('userData');
  console.log(`[main] userData: ${userData}`);

  // Start the backend
  spawnBackend(userData);

  // Wait until backend is ready, then create the window
  try {
    await waitForBackend();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'Startup Failed',
      `The backend server failed to start.\n\n${(err as Error).message}\n\n` +
        'Please try restarting the app. If the problem persists, reinstall.'
    );
    killBackend();
    app.quit();
  }
});

// macOS: re-create window when dock icon is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit when all windows are closed (Windows / Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Kill backend before quitting — CRITICAL to avoid orphaned processes
app.on('before-quit', () => {
  killBackend();
});

// IPC: renderer can request the backend URL
ipcMain.handle('get-api-url', () => `http://127.0.0.1:${BACKEND_PORT}/api/v1`);
