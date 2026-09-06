from sqlalchemy import Integer, String, Boolean, Time, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Ciudad(Base):
    __tablename__ = "ciudades"

    id_ciudad: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    sucursales: Mapped[list["Sucursal"]] = relationship(back_populates="ciudad")


class Sucursal(Base):
    __tablename__ = "sucursales"

    id_sucursal: Mapped[int] = mapped_column(Integer, primary_key=True)
    ciudad_id: Mapped[int] = mapped_column(
        ForeignKey("ciudades.id_ciudad"), nullable=False
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    direccion: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    horario_apertura: Mapped[Time] = mapped_column(Time, nullable=False)
    horario_cierre: Mapped[Time] = mapped_column(Time, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    ciudad: Mapped["Ciudad"] = relationship(back_populates="sucursales")
    empleados: Mapped[list["Usuario"]] = relationship(back_populates="sucursal")
