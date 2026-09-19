from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Inventario, Producto, ProductoVariante, Sucursal, Usuario
from app.schemas.comercio import InventarioOut, SucursalDisponibilidadOut

router = APIRouter()


@router.get(
    "/disponibilidad",
    response_model=list[SucursalDisponibilidadOut],
    summary="Consultar disponibilidad de una variante por sucursal (CU6, RF08)",
)
def disponibilidad(
    variante_id: int,
    sucursal_id: int | None = None,
    ciudad_id: int | None = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Devuelve el estado de la variante en las sucursales activas,
    con nombre, ciudad y stock mínimo (excluye inactivas activo=false)."""
    consulta = (
        db.query(Inventario)
        .join(Sucursal, Inventario.sucursal_id == Sucursal.id_sucursal)
        .filter(Inventario.variante_id == variante_id)
        .filter(Sucursal.activo == True)  # noqa: E712
    )
    if sucursal_id:
        consulta = consulta.filter(Inventario.sucursal_id == sucursal_id)
    if ciudad_id:
        consulta = consulta.filter(Sucursal.ciudad_id == ciudad_id)
    registros = consulta.all()

    return [
        {
            "variante_id": r.variante_id,
            "sucursal_id": r.sucursal_id,
            "nombre_sucursal": r.sucursal.nombre,
            "ciudad": r.sucursal.ciudad.nombre,
            "cantidad_disponible": r.cantidad_disponible,
            "cantidad_reservada": r.cantidad_reservada,
            "cantidad_recibida": r.cantidad_recibida,
            "stock_minimo": r.stock_minimo,
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
