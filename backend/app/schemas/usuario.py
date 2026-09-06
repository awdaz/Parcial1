from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models.enums import RolUsuario


class UsuarioBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    telefono: str | None = Field(default=None, max_length=20)


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(min_length=6, max_length=255)
    rol: RolUsuario = RolUsuario.cliente
    sucursal_id: int | None = None


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    telefono: str | None = None
    activo: bool | None = None
    sucursal_id: int | None = None


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    rol: RolUsuario
    sucursal_id: int | None
    fecha_registro: datetime
    activo: bool


class LoginRequest(BaseModel):
    email: EmailStr
    contrasena: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
