from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import admin_required, encargado_required, get_current_user
from app.db.session import get_db
from app.models import (
    Reserva,
    ReservaItem,
    Usuario,
)
from app.schemas.comercio import ReservaCreate, ReservaOut

router = APIRouter()


def _reserva_con_items(db: Session, reserva_id: int) -> Reserva:
    reserva = (
        db.query(Reserva)
        .filter(Reserva.id_reserva == reserva_id)
        .first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


@router.post(
    "/", response_model=ReservaOut, status_code=status.HTTP_201_CREATED,
    summary="Crear reserva de múltiples prendas (CU8)",
)
def crear_reserva(
    data: ReservaCreate,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    if current.rol != "admin" and current.rol != "cliente":
        raise HTTPException(status_code=403, detail="Solo clientes pueden reservar")

    reserva = Reserva(
        usuario_id=current.id_usuario,
        sucursal_id=data.sucursal_id,
        fecha_reserva=data.fecha_reserva,
        hora_atencion=data.hora_atencion,
    )
    db.add(reserva)
    db.flush()  # obtener id_reserva

    for item in data.items:
        # Se delega la validación de stock a través del SP o manualmente
        db.add(
            ReservaItem(
                reserva_id=reserva.id_reserva,
                variante_id=item.variante_id,
                cantidad=item.cantidad,
            )
        )

    db.commit()
    db.refresh(reserva)
    return reserva


@router.get("/", response_model=list[ReservaOut], summary="Listar mis reservas (CU9)")
def list_reservas(
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    query = db.query(Reserva)
    if current.rol == "cliente":
        query = query.filter(Reserva.usuario_id == current.id_usuario)
    # encargado/admin ven todas
    return query.all()


@router.get("/{reserva_id}", response_model=ReservaOut, summary="Detalle de reserva")
def get_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    reserva = _reserva_con_items(db, reserva_id)
    if current.rol == "cliente" and reserva.usuario_id != current.id_usuario:
        raise HTTPException(status_code=403, detail="No autorizado")
    return reserva


@router.patch(
    "/{reserva_id}/cancelar", response_model=ReservaOut,
    summary="Cancelar reserva (libera stock)",
)
def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    reserva = _reserva_con_items(db, reserva_id)
    if current.rol == "cliente" and reserva.usuario_id != current.id_usuario:
        raise HTTPException(status_code=403, detail="No autorizado")
    if reserva.estado not in ("pendiente", "preparada"):
        raise HTTPException(status_code=400, detail="No se puede cancelar en este estado")

    reserva.estado = "cancelada"
    db.commit()
    db.refresh(reserva)
    return reserva


@router.patch(
    "/{reserva_id}/preparar", response_model=ReservaOut,
    summary="Preparar reserva (encargado - CU18)",
)
def preparar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(encargado_required),
):
    reserva = _reserva_con_items(db, reserva_id)
    if reserva.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se preparan reservas pendientes")
    reserva.estado = "preparada"
    db.commit()
    db.refresh(reserva)
    return reserva


@router.patch(
    "/{reserva_id}/completar", response_model=ReservaOut,
    summary="Completar reserva (encargado)",
)
def completar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(encargado_required),
):
    reserva = _reserva_con_items(db, reserva_id)
    if reserva.estado not in ("pendiente", "preparada"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    reserva.estado = "completada"
    db.commit()
    db.refresh(reserva)
    return reserva
