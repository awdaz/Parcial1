from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import admin_required, encargado_required
from app.db.session import get_db
from app.models import Sucursal, Usuario
from app.schemas.comercio import SucursalCreate, SucursalOut

router = APIRouter()


@router.get("/", response_model=list[SucursalOut], summary="Listar sucursales activas")
def list_sucursales(db: Session = Depends(get_db)):
    return db.query(Sucursal).filter(Sucursal.activo == True).all()  # noqa: E712


@router.get("/{sucursal_id}", response_model=SucursalOut, summary="Obtener sucursal")
def get_sucursal(sucursal_id: int, db: Session = Depends(get_db)):
    sucursal = db.get(Sucursal, sucursal_id)
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal


@router.post(
    "/", response_model=SucursalOut, status_code=status.HTTP_201_CREATED,
    summary="Crear sucursal (admin)",
)
def create_sucursal(
    data: SucursalCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
):
    sucursal = Sucursal(**data.model_dump())
    db.add(sucursal)
    db.commit()
    db.refresh(sucursal)
    return sucursal
