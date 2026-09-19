from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import admin_required, get_current_user_optional
from app.db.session import get_db
from app.models import Ciudad, Inventario, Reserva, Sucursal, Usuario
from app.models.enums import EstadoReserva, RolUsuario
from app.schemas.comercio import (
    CiudadOut,
    SucursalCreate,
    SucursalOut,
    SucursalUpdate,
)

router = APIRouter()


def _sucursal_o_404(db: Session, sucursal_id: int) -> Sucursal:
    sucursal = (
        db.query(Sucursal)
        .options(joinedload(Sucursal.ciudad))
        .filter(Sucursal.id_sucursal == sucursal_id)
        .first()
    )
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal


def _ciudad_o_404(db: Session, ciudad_id: int) -> Ciudad:
    ciudad = db.get(Ciudad, ciudad_id)
    if not ciudad:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada")
    return ciudad


def _nombre_disponible(
    db: Session, nombre: str, excluir_id: int | None = None
) -> None:
    existe = db.query(Sucursal).filter(Sucursal.nombre == nombre)
    if excluir_id is not None:
        existe = existe.filter(Sucursal.id_sucursal != excluir_id)
    if db.query(existe.exists()).scalar():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de sucursal ya está en uso",
        )


@router.get("/ciudades", response_model=list[CiudadOut], summary="Listar ciudades")
def list_ciudades(db: Session = Depends(get_db)):
    return db.query(Ciudad).order_by(Ciudad.nombre).all()


@router.get(
    "/",
    response_model=list[SucursalOut],
    summary="Listar sucursales",
)
def list_sucursales(
    db: Session = Depends(get_db),
    todas: bool = Query(
        default=False,
        description="Incluir sucursales inactivas (solo administrador)",
    ),
    usuario: Usuario | None = Depends(get_current_user_optional),
):
    if todas and (usuario is None or usuario.rol != RolUsuario.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción",
        )
    query = db.query(Sucursal).options(joinedload(Sucursal.ciudad))
    if not todas:
        query = query.filter(Sucursal.activo == True)  # noqa: E712
    return query.order_by(Sucursal.nombre).all()


@router.get("/{sucursal_id}", response_model=SucursalOut, summary="Obtener sucursal")
def get_sucursal(sucursal_id: int, db: Session = Depends(get_db)):
    return _sucursal_o_404(db, sucursal_id)


@router.post(
    "/",
    response_model=SucursalOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear sucursal (admin)",
)
def create_sucursal(
    data: SucursalCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
):
    _ciudad_o_404(db, data.ciudad_id)
    _nombre_disponible(db, data.nombre)
    sucursal = Sucursal(**data.model_dump())
    db.add(sucursal)
    db.commit()
    db.refresh(sucursal)
    return _sucursal_o_404(db, sucursal.id_sucursal)


@router.patch(
    "/{sucursal_id}",
    response_model=SucursalOut,
    summary="Editar sucursal (admin)",
)
def update_sucursal(
    sucursal_id: int,
    data: SucursalUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
):
    sucursal = _sucursal_o_404(db, sucursal_id)
    cambios = data.model_dump(exclude_unset=True)
    if "ciudad_id" in cambios:
        _ciudad_o_404(db, cambios["ciudad_id"])
    if "nombre" in cambios:
        _nombre_disponible(db, cambios["nombre"], excluir_id=sucursal_id)
    for campo, valor in cambios.items():
        setattr(sucursal, campo, valor)
    db.commit()
    db.refresh(sucursal)
    return _sucursal_o_404(db, sucursal.id_sucursal)


@router.delete(
    "/{sucursal_id}",
    response_model=SucursalOut,
    summary="Desactivar sucursal (admin)",
)
def desactivar_sucursal(
    sucursal_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
    forzar: bool = Query(
        default=False,
        description="Desactivar aun con inventario o reservas activas",
    ),
):
    sucursal = _sucursal_o_404(db, sucursal_id)
    if not sucursal.activo:
        raise HTTPException(status_code=400, detail="La sucursal ya está desactivada")

    tiene_inventario = db.query(
        db.query(Inventario.id_inventario)
        .filter(Inventario.sucursal_id == sucursal_id)
        .exists()
    ).scalar()
    tiene_reservas = db.query(
        db.query(Reserva.id_reserva)
        .filter(
            Reserva.sucursal_id == sucursal_id,
            Reserva.estado.in_([EstadoReserva.pendiente, EstadoReserva.preparada]),
        )
        .exists()
    ).scalar()
    tiene_operaciones = tiene_inventario or tiene_reservas

    if tiene_operaciones and not forzar:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Esta sucursal tiene operaciones activas (inventario o reservas). "
                "Envíe forzar=true si desea desactivarla de todos modos."
            ),
        )

    sucursal.activo = False
    db.commit()
    db.refresh(sucursal)
    return _sucursal_o_404(db, sucursal.id_sucursal)