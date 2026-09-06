from collections.abc import Generator

from app.db.base import SessionLocal


def get_db() -> Generator:
    """Dependencia FastAPI que provee una sesión de base de datos por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
