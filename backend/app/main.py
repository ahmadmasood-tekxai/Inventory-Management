import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, cash, dashboard, expenses, purchases
from app.api.routes.items import router as items_router
from app.api.routes.items import sales_router
from app.core.config import settings
from app.core.database import Base, engine

logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG)
logger = logging.getLogger("qasim_inventory")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # For quick local/dev bootstrapping. In production, use Alembic migrations instead.
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured (create_all).")
    yield


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
