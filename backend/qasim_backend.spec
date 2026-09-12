# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for qasim_backend.exe
# Run: pyinstaller qasim_backend.spec  (from the backend/ directory)
# Requires: pyinstaller>=6.15 (tested with 6.22.2 on Python 3.14)
#
# Output: backend/dist/qasim_backend.exe  (Windows)
#         backend/dist/qasim_backend      (Mac/Linux)

import sys
from pathlib import Path

block_cipher = None

# Collect all sub-packages that FastAPI/uvicorn load dynamically at runtime
# so PyInstaller doesn't miss them during the static analysis phase.
from PyInstaller.utils.hooks import collect_all, collect_submodules

# ---- Hidden imports that static analysis misses -------------------------
hidden_imports = [
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.http.httptools_impl",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.protocols.websockets.websockets_impl",
    "uvicorn.protocols.websockets.wsproto_impl",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "uvicorn.lifespan.off",
    "email_validator",
    "passlib.handlers.bcrypt",
    "passlib.handlers.sha2_crypt",
    "passlib.handlers.pbkdf2",
    "jose",
    "jose.jwt",
    "multipart",
    "sqlalchemy.dialects.sqlite",
    "sqlalchemy.dialects.sqlite.pysqlite",
    # App modules
    "app",
    "app.main",
    "app.core",
    "app.core.config",
    "app.core.database",
    "app.core.security",
    "app.api",
    "app.api.deps",
    "app.api.routes",
    "app.api.routes.auth",
    "app.api.routes.items",
    "app.api.routes.sales",
    "app.api.routes.expenses",
    "app.api.routes.cash",
    "app.api.routes.purchases",
    "app.api.routes.dashboard",
    "app.models",
    "app.schemas",
    "app.services",
    "app.utils",
]

# Collect data files needed at runtime (e.g. alembic migration scripts)
datas = [
    ("app", "app"),
    ("alembic", "alembic"),
    ("alembic.ini", "."),
]

a = Analysis(
    ["run_server.py"],
    pathex=[str(Path(".").resolve())],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "psycopg2",
        "psycopg2_binary",
        "matplotlib",
        "numpy",
        "pandas",
        "PIL",
        "tkinter",
        "PyQt5",
        "PyQt6",
        "PySide2",
        "PySide6",
        "wx",
        "gi",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="qasim_backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,         # Compress with UPX if available (reduces size ~20%)
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,      # Console must be True — Electron reads stdout/stderr
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
