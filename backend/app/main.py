import logging
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.api.routes import auth, cash, dashboard, expenses, purchases
from app.api.routes import alerts as alerts_routes
from app.api.routes.items import router as items_router
from app.api.routes.items import sales_router
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.item import Item

logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG)
logger = logging.getLogger("qasim_inventory")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # For quick local/dev bootstrapping. In production, use Alembic migrations instead.
    Base.metadata.create_all(bind=engine)
    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Database tables ensured (create_all).")
    yield


UPLOAD_DIR = Path("uploads/items")


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Qasim Inventory — stock, sales, expenses, cash & purchases management.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a clean, frontend-friendly shape for 422 validation errors."""
    errors = [{"field": ".".join(str(x) for x in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": "Validation failed", "errors": errors})


@app.get("/", tags=["Health"])
def root():
    return {"service": settings.APP_NAME, "status": "ok"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


API_PREFIX = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(items_router, prefix=API_PREFIX)
app.include_router(sales_router, prefix=API_PREFIX)
app.include_router(expenses.router, prefix=API_PREFIX)
app.include_router(cash.router, prefix=API_PREFIX)
app.include_router(purchases.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(alerts_routes.router, prefix=API_PREFIX)

# Serve uploaded item images as static files
uploads_path = Path("uploads")
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.post(f"{API_PREFIX}/items/{{item_id}}/image", tags=["Items & Stock"])
async def upload_item_image(item_id: int, file: UploadFile = File(...)):
    """Upload or replace an item's image. Saved to uploads/items/<uuid>.<ext>."""
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, or GIF images are allowed.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "img.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename

    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)

    db: Session = SessionLocal()
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=404, detail="Item not found")
        # Delete old image if exists
        if item.image_path:
            old = Path(item.image_path)
            if old.exists():
                old.unlink(missing_ok=True)
        item.image_path = str(dest)
        db.commit()
    finally:
        db.close()

    return {"image_path": str(dest), "image_url": f"/uploads/items/{filename}"}
