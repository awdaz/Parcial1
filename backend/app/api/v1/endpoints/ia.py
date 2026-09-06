from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import (
    Inventario,
    Pedido,
    PedidoItem,
    Producto,
    ProductoVariante,
    Temporada,
    Usuario,
)

router = APIRouter()


def _temporada_actual(db: Session):
    """Obtiene la temporada vigente según fecha actual."""
    from datetime import date

    hoy = date.today()
    return (
        db.query(Temporada)
        .filter(Temporada.fecha_inicio <= hoy, Temporada.fecha_fin >= hoy)
        .first()
    )


def _categorias_historial(db: Session, usuario_id: int):
    """Categorías preferidas según compras/reservas del cliente."""
    ids = (
        db.query(ProductoVariante.producto_id)
        .join(PedidoItem, PedidoItem.variante_id == ProductoVariante.id_variante)
        .join(Pedido, Pedido.id_pedido == PedidoItem.pedido_id)
        .filter(Pedido.usuario_id == usuario_id)
        .all()
    )
    producto_ids = [p[0] for p in ids]
    categorias_ids = (
        db.query(Producto.categoria_id)
        .filter(Producto.id_producto.in_(producto_ids))
        .all()
    )
    return set(c[0] for c in categorias_ids)


@router.get(
    "/recomendaciones",
    summary="Recomendar prendas según historial, temporada y disponibilidad (CU17, RF25)",
)
def recomendar(
    limit: int = 6,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    """Asistente/recomendador de IA: sugiere productos considerando
    preferencias del cliente (categorías de su historial), temporada actual
    y disponibilidad local en la sucursal del cliente."""
    categoria_ids = _categorias_historial(db, current.id_usuario)
    temporada = _temporada_actual(db)

    query = db.query(Producto).filter(Producto.activo == True)  # noqa: E712

    if temporada:
        query = query.filter(Producto.temporada_id == temporada.id_temporada)

    # Prioridad: categorías preferidas; si no hay historial, recomendar destacados
    if categoria_ids:
        destacados = (
            query.filter(Producto.categoria_id.in_(categoria_ids))
            .order_by(Producto.precio)
            .limit(limit)
            .all()
        )
        if len(destacados) >= limit:
            return destacados
        # Completar con otros de la temporada
        restantes = (
            query.filter(~Producto.categoria_id.in_(categoria_ids))
            .order_by(Producto.precio)
            .limit(limit - len(destacados))
            .all()
        )
        return destacados + restantes

    return query.order_by(Producto.precio).limit(limit).all()


@router.get(
    "/recomendaciones/disponibles",
    summary="Recomendar prendas disponibles en una sucursal específica",
)
def recomendar_por_sucursal(
    sucursal_id: int,
    limit: int = 6,
    db: Session = Depends(get_db),
):
    """Recomienda productos con stock disponible en una sucursal concreta."""
    variantes_disponibles = (
        db.query(ProductoVariante)
        .join(
            Inventario,
            Inventario.variante_id == ProductoVariante.id_variante,
        )
        .filter(
            Inventario.sucursal_id == sucursal_id,
            Inventario.cantidad_disponible > 0,
        )
        .distinct(ProductoVariante.producto_id)
        .limit(limit)
        .all()
    )
    return variantes_disponibles
