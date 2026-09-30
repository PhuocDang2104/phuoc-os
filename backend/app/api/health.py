import logging

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

router = APIRouter(tags=["health"])
logger = logging.getLogger("phuoc.api")


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness: the process can serve requests, independent of the database."""
    return {"status": "ok"}


@router.get("/health/db")
def database_health(request: Request) -> dict[str, str]:
    """Readiness: use a real query, without exposing connection details."""
    engine = request.app.state.engine
    if engine is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.warning("database_health_unavailable")
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return {"status": "ok"}
