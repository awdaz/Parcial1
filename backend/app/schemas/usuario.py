from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models.enums import RolUsuario

TELEFONO_PATTERN = r"^\+?[0-9()][0-9\s\-().]{6,19}$"

Telefono = Annotated[
    str | None,
    Field(
        default=None,
        min_length=7,
        max_length=20,
        pattern=TELEFONO_PATTERN,
        description="Formato: dígitos, espacios, guiones o paréntesis. Ej: (591) 700-000-000",
    ),
]


class UsuarioBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    telefono: Telefono


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(min_length=6, max_length=255)
    rol: RolUsuario = RolUsuario.cliente
    sucursal_id: int | None = None


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    telefono: str | None = Field(
        default=None,
        min_length=7,
        max_length=20,
        pattern=TELEFONO_PATTERN,
    )
    activo: bool | None = None
    sucursal_id: int | None = None


class UsuarioAdminCreate(UsuarioBase):
    contrasena: str = Field(min_length=6, max_length=255)
    rol: RolUsuario
    sucursal_id: int | None = None


class UsuarioAdminUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    telefono: Telefono = None
    rol: RolUsuario | None = None
    sucursal_id: int | None = None
    activo: bool | None = None


class PerfilUpdate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    telefono: Telefono


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
