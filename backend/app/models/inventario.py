from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SAEnum,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import TipoMovimiento


class Inventario(Base):
    __tablename__ = "inventario"
    __table_args__ = (
        UniqueConstraint(
            "variante_id", "sucursal_id", name="uq_inventario_variante_sucursal"
        ),
    )

    id_inventario: Mapped[int] = mapped_column(Integer, primary_key=True)
    variante_id: Mapped[int] = mapped_column(
        ForeignKey("producto_variantes.id_variante"), nullable=False
    )
    sucursal_id: Mapped[int] = mapped_column(
        ForeignKey("sucursales.id_sucursal"), nullable=False
    )
    cantidad_disponible: Mapped[int] = mapped_column(Integer, nullable=False)
    cantidad_reservada: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    cantidad_recibida: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    stock_minimo: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    variante: Mapped["ProductoVariante"] = relationship()
    sucursal: Mapped["Sucursal"] = relationship()


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id_movimiento: Mapped[int] = mapped_column(Integer, primary_key=True)
    variante_id: Mapped[int] = mapped_column(
        ForeignKey("producto_variantes.id_variante"), nullable=False
    )
    sucursal_id: Mapped[int] = mapped_column(
        ForeignKey("sucursales.id_sucursal"), nullable=False
    )
    tipo_movimiento: Mapped[TipoMovimiento] = mapped_column(
        SAEnum(
            TipoMovimiento,
            name="tipo_movimiento",
            native_enum=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    referencia_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_movimiento: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    variante: Mapped["ProductoVariante"] = relationship()
    sucursal: Mapped["Sucursal"] = relationship()
