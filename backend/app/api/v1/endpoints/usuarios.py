from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import admin_required, get_current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models import Pedido, Reserva, Sucursal, Usuario
from app.models.enums import EstadoPedido, EstadoReserva, RolUsuario
from app.schemas.usuario import UsuarioAdminCreate, UsuarioAdminUpdate, UsuarioOut

router = APIRouter()


@router.get("/", response_model=list[UsuarioOut], summary="Listar todos los usuarios (admin)")
def list_usuarios(
    rol: RolUsuario | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
):
    query = db.query(Usuario)
    if rol:
        query = query.filter(Usuario.rol == rol)
    return query.order_by(Usuario.id_usuario.desc()).all()


def _validar_sucursal(db: Session, rol: RolUsuario, sucursal_id: int | None) -> int | None:
    if rol == RolUsuario.cliente:
        return None
    if rol in (RolUsuario.encargado, RolUsuario.cajero) and sucursal_id is None:
        raise HTTPException(status_code=422, detail="Encargado y cajero deben tener una sucursal asignada")
    if sucursal_id is not None:
        sucursal = db.get(Sucursal, sucursal_id)
        if not sucursal or not sucursal.activo:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada o inactiva")
    return sucursal_id


def _tiene_operaciones_activas(db: Session, usuario_id: int) -> bool:
    reserva_activa = db.query(
        db.query(Reserva.id_reserva)
        .filter(
            Reserva.usuario_id == usuario_id,
            Reserva.estado.in_([EstadoReserva.pendiente, EstadoReserva.preparada]),
        )
        .exists()
    ).scalar()
    pedido_activo = db.query(
        db.query(Pedido.id_pedido)
        .filter(
            Pedido.usuario_id == usuario_id,
            Pedido.estado.in_([e for e in EstadoPedido if e != EstadoPedido.cancelado]),
        )
        .exists()
    ).scalar()
    return reserva_activa or pedido_activo


@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED, summary="Crear usuario y asignar rol")
def create_usuario(
    data: UsuarioAdminCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(admin_required),
):
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está en uso")
    sucursal_id = _validar_sucursal(db, data.rol, data.sucursal_id)
    usuario = Usuario(
        nombre=data.nombre,
        email=data.email,
        telefono=data.telefono,
        contrasena=hash_password(data.contrasena),
        rol=data.rol,
        sucursal_id=sucursal_id,
    )
    try:
        db.add(usuario)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El correo ya está en uso")
    db.refresh(usuario)
    return usuario


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


@router.patch("/{usuario_id}", response_model=UsuarioOut, summary="Actualizar usuario, rol o estado")
def update_usuario(
    usuario_id: int,
    data: UsuarioAdminUpdate,
    db: Session = Depends(get_db),
    current: Usuario = Depends(admin_required),
    forzar: bool = Query(default=False, description="Desactivar aunque tenga operaciones activas"),
):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cambios = data.model_dump(exclude_unset=True)
    if cambios.get("activo") is False:
        if usuario.id_usuario == current.id_usuario:
            raise HTTPException(status_code=400, detail="No puede desactivar su propia cuenta")
        if not forzar and _tiene_operaciones_activas(db, usuario_id):
            raise HTTPException(
                status_code=409,
                detail="Este usuario tiene operaciones activas. Envíe forzar=true para desactivarlo de todos modos.",
            )

    if "email" in cambios and cambios["email"] != usuario.email:
        existe = db.query(Usuario).filter(Usuario.email == cambios["email"]).first()
        if existe:
            raise HTTPException(status_code=400, detail="El correo ya está en uso")

    rol_final = cambios.get("rol", usuario.rol)
    sucursal_final = cambios["sucursal_id"] if "sucursal_id" in cambios else usuario.sucursal_id
    sucursal_final = _validar_sucursal(db, rol_final, sucursal_final)
    if rol_final == RolUsuario.cliente:
        cambios["sucursal_id"] = None

    for field, value in cambios.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario
