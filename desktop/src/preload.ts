/**
 * Electron Preload Script
 *
 * This script runs in a special context with access to both the renderer
 * and (limited) Node.js APIs. It bridges the gap between the sandboxed
 * renderer and the main process via contextBridge.
 *
 * SECURITY: contextIsolation is ON. We only expose what the renderer
 * absolutely needs — in this case, just the backend URL so the React
 * API client can talk to the local FastAPI server.
 */

import { contextBridge, ipcRenderer } from 'electron';

// ─── Synchronous exposure ─────────────────────────────────────────────────────
// The backend always runs on a fixed port so we can hard-code it here.
// If you ever need dynamic port assignment, use ipcRenderer.invoke('get-api-url')
// instead (see main.ts's ipcMain.handle('get-api-url')).

const BACKEND_PORT = 8756;

contextBridge.exposeInMainWorld('ELECTRON_API_URL', `http://127.0.0.1:${BACKEND_PORT}/api/v1`);

// ─── Optional: expose a safe IPC bridge ──────────────────────────────────────
// This lets the renderer call main-process functions in a type-safe way
// without enabling nodeIntegration.

contextBridge.exposeInMainWorld('electronBridge', {
  /** Get the backend base URL (including /api/v1) */
  getApiUrl: (): Promise<string> => ipcRenderer.invoke('get-api-url'),
});
