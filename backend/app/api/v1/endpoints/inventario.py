from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import encargado_required
from app.db.session import get_db
from app.models import Inventario, Producto, ProductoVariante, Usuario
from app.schemas.comercio import InventarioOut

router = APIRouter()


@router.get(
    "/disponibilidad",
    summary="Consultar disponibilidad de una variante por sucursal (CU6, RF08)",
)
def disponibilidad(variante_id: int, db: Session = Depends(get_db)):
    """Devuelve el estado de la variante en todas las sucursales (o donde esté disponible)."""
    registros = (
        db.query(Inventario)
        .filter(Inventario.variante_id == variante_id)
        .all()
    )
    return [
        {
            "id_inventario": r.id_inventario,
            "variante_id": r.variante_id,
            "sucursal_id": r.sucursal_id,
            "cantidad_disponible": r.cantidad_disponible,
            "cantidad_reservada": r.cantidad_reservada,
            "cantidad_recibida": r.cantidad_recibida,
            "estado": (
                "Disponible"
                if r.cantidad_disponible > 0
                else (
                    "Reservada"
                    if r.cantidad_reservada > 0
                    else (
                        "Proxima a ingresar"
                        if r.cantidad_recibida > 0
                        else "Agotada"
                    )
                )
            ),
        }
        for r in registros
    ]


@router.get(
    "/", response_model=list[InventarioOut],
    summary="Listar inventario (filtro por sucursal)",
)
def list_inventario(
    sucursal_id: int | None = None,
    variante_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Inventario)
    if sucursal_id:
        query = query.filter(Inventario.sucursal_id == sucursal_id)
    if variante_id:
        query = query.filter(Inventario.variante_id == variante_id)
    return query.all()


@router.get("/agotados", summary="Productos agotados o con stock bajo")
def productos_estado(stock_bajo: bool = False, db: Session = Depends(get_db)):
    query = (
        db.query(Inventario)
        .join(ProductoVariante)
        .join(Producto)
        .filter(Inventario.cantidad_disponible == 0)
    )
    if stock_bajo:
        query = db.query(Inventario).filter(
            Inventario.cantidad_disponible <= Inventario.stock_minimo
        )
    return query.all()
