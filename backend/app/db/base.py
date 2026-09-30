from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Register future persistent models here for Alembic autogeneration."""
