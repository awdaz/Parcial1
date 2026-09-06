from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import admin_required, encargado_required
from app.db.session import get_db
from app.models import (
    Categoria,
    Producto,
    ProductoVariante,
    Usuario,
)
from app.schemas.comercio import (
    CategoriaOut,
    ProductoCreate,
    ProductoOut,
    ProductoUpdate,
    ProductoVarianteCreate,
    ProductoVarianteOut,
)

router = APIRouter()


@router.get(
    "/categorias",
    response_model=list[CategoriaOut] | None,
    summary="Listar categorías",
)
def list_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).all()


@router.get(
    "/productos",
    response_model=list[ProductoOut],
    summary="Filtrar/consultar catálogo (CU4, CU5)",
)
def list_productos(
    categoria_id: int | None = None,
    temporada_id: int | None = None,
    talla_id: int | None = None,
    color_id: int | None = None,
    proveedor_id: int | None = None,
    precio_min: float | None = None,
    precio_max: float | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Producto)
        .options(joinedload(Producto.categoria), joinedload(Producto.temporada))
        .filter(Producto.activo == True)  # noqa: E712
    )

    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)
    if temporada_id:
        query = query.filter(Producto.temporada_id == temporada_id)
    if proveedor_id:
        query = query.filter(Producto.proveedor_id == proveedor_id)
    if precio_min is not None:
        query = query.filter(Producto.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(Producto.precio <= precio_max)
    if q:
        query = query.filter(Producto.nombre.ilike(f"%{q}%"))

    if talla_id or color_id:
        # Filtrar por variantes (talla/color)
        query = query.join(ProductoVariante).distinct()
        if talla_id:
            query = query.filter(ProductoVariante.talla_id == talla_id)
        if color_id:
            query = query.filter(ProductoVariante.color_id == color_id)

    return query.all()


@router.get("/productos/{producto_id}", response_model=ProductoOut, summary="Detalle de producto")
def get_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.post(
    "/productos", response_model=ProductoOut, status_code=status.HTTP_201_CREATED,
    summary="Crear producto (admin/encargado)",
)
def create_producto(
    data: ProductoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(encargado_required),
):
    producto = Producto(**data.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.patch("/productos/{producto_id}", response_model=ProductoOut, summary="Actualizar producto")
def update_producto(
    producto_id: int,
    data: ProductoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(encargado_required),
):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(producto, field, value)
    db.commit()
    db.refresh(producto)
    return producto


@router.post(
    "/productos/variantes", response_model=ProductoVarianteOut,
    status_code=status.HTTP_201_CREATED, summary="Agregar variante a producto",
)
def create_variante(
    data: ProductoVarianteCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(encargado_required),
):
    variante = ProductoVariante(**data.model_dump())
    db.add(variante)
    db.commit()
    db.refresh(variante)
    return variante
