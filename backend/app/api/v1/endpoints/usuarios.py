from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import admin_required, get_current_user
from app.db.session import get_db
from app.models import Usuario
from app.schemas.usuario import UsuarioOut, UsuarioUpdate

router = APIRouter()


@router.get("/", response_model=list[UsuarioOut], summary="Listar todos los usuarios (admin)")
def list_usuarios(
    rol: str | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
):
    query = db.query(Usuario)
    if rol:
        query = query.filter(Usuario.rol == rol)
    return query.all()


@router.get("/{usuario_id}", response_model=UsuarioOut, summary="Obtener un usuario")
def get_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # No-admin solo puede ver su propio perfil
    if current.rol != "admin" and current.id_usuario != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return usuario


@router.patch("/{usuario_id}", response_model=UsuarioOut, summary="Actualizar usuario")
def update_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    if current.rol != "admin" and current.id_usuario != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario
