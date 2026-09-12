/**
 * Type declarations for globals injected by Electron's preload script.
 *
 * When the frontend runs inside Electron, the preload script uses
 * contextBridge to expose `window.ELECTRON_API_URL` — a string pointing
 * to the locally-running FastAPI backend (e.g. "http://127.0.0.1:8756/api/v1").
 *
 * When running as a normal web app these globals are undefined, and the
 * API client falls back to the VITE_API_BASE_URL env variable.
 */

interface Window {
  /** Injected by Electron preload — the backend base URL including /api/v1 */
  ELECTRON_API_URL?: string;
}
