from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import RolUsuario


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contrasena: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(
        SAEnum(
            RolUsuario,
            name="rol_usuario",
            native_enum=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    sucursal_id: Mapped[int | None] = mapped_column(
        ForeignKey("sucursales.id_sucursal"), nullable=True
    )
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    sucursal: Mapped["Sucursal"] = relationship(back_populates="empleados")
    reservas: Mapped[list["Reserva"]] = relationship(back_populates="usuario")
    pedidos: Mapped[list["Pedido"]] = relationship(back_populates="usuario")
