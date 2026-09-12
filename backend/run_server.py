"""
run_server.py — PyInstaller entry point for the packaged Qasim Inventory backend.

This file is what PyInstaller compiles into qasim_backend.exe.
It is NOT used in normal development (use `uvicorn app.main:app` for that).

Electron spawns this executable and passes:
  - QASIM_DATA_DIR : path where the SQLite DB and uploaded files will be stored
  - QASIM_PORT     : port to listen on (defaults to 8756)

The backend prints "READY:<port>" to stdout once uvicorn is accepting connections,
so Electron's main process can reliably know when to open the BrowserWindow.
"""

import os
import sys

# ---------------------------------------------------------------------------
# PyInstaller sets sys._MEIPASS when running from the bundled .exe.
# We need to add it to sys.path so `import app.*` resolves correctly.
# ---------------------------------------------------------------------------
if hasattr(sys, "_MEIPASS"):
    sys.path.insert(0, sys._MEIPASS)  # type: ignore[attr-defined]

# ---------------------------------------------------------------------------
# Resolve configuration from env vars set by Electron before import of app.*
# (import of app.core.config must happen AFTER we set these)
# ---------------------------------------------------------------------------
port = int(os.environ.get("QASIM_PORT", "8756"))
data_dir = os.environ.get("QASIM_DATA_DIR", "")

if data_dir:
    import pathlib
    pathlib.Path(data_dir).mkdir(parents=True, exist_ok=True)
    db_path = str(pathlib.Path(data_dir) / "qasim_inventory.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ["UPLOADS_DIR"] = str(pathlib.Path(data_dir) / "uploads")
else:
    os.environ.setdefault("DATABASE_URL", "sqlite:///./qasim_inventory.db")

# Allow all origins so Electron's file:// renderer can reach the API
os.environ.setdefault("CORS_ORIGINS", "*")

# ---------------------------------------------------------------------------
# Start uvicorn. We use the programmatic API so PyInstaller can bundle it.
# ---------------------------------------------------------------------------
import uvicorn

if __name__ == "__main__":
    print(f"READY:{port}", flush=True)
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=port,
        log_level="warning",
        # Disable reload — not supported in frozen executables
        reload=False,
    )
