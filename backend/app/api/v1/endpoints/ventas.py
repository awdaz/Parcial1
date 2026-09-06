from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import cajero_required, get_current_user
from app.db.session import get_db
from app.models import (
    Inventario,
    Pago,
    Pedido,
    PedidoItem,
    Producto,
    ProductoVariante,
    Usuario,
)
from app.schemas.comercio import VentaDigitalCreate, VentaPresencialCreate
from app.services.stripe_service import (
    confirmar_pago_simulado,
    crear_intencion_pago,
)

router = APIRouter()


def _precio_variante(db: Session, variante_id: int) -> Decimal:
    variante = db.get(ProductoVariante, variante_id)
    if not variante:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    return variante.producto.precio + (variante.precio_extra or 0)


def _validar_stock(db: Session, sucursal_id: int, variante_id: int, cantidad: int):
    stock = (
        db.query(Inventario)
        .filter(
            Inventario.variante_id == variante_id,
            Inventario.sucursal_id == sucursal_id,
        )
        .first()
    )
    if not stock or stock.cantidad_disponible < cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente de la variante {variante_id} en la sucursal {sucursal_id}",
        )


@router.post(
    "/presencial", status_code=status.HTTP_201_CREATED,
    summary="Registrar venta presencial en caja (CU11, CU17, RF17, RF18)",
)
def venta_presencial(
    data: VentaPresencialCreate,
    db: Session = Depends(get_db),
    current: Usuario = Depends(cajero_required),
):
    # 1. Validar stock y calcular total
    total = Decimal("0")
    for item in data.items:
        _validar_stock(db, data.sucursal_id, item.variante_id, item.cantidad)
        precio = _precio_variante(db, item.variante_id)
        total += precio * item.cantidad

    # 2. Crear pedido pagado (presencial)
    pedido = Pedido(
        usuario_id=current.id_usuario,
        sucursal_id=data.sucursal_id,
        total=total,
        metodo_compra="presencial",
        estado="pagado",
        tipo_pago=data.tipo_pago,
    )
    db.add(pedido)
    db.flush()

    # 3. Crear ítems y descontar stock
    for item in data.items:
        precio = _precio_variante(db, item.variante_id)
        db.add(
            PedidoItem(
                pedido_id=pedido.id_pedido,
                variante_id=item.variante_id,
                cantidad=item.cantidad,
                precio_unitario=precio,
                subtotal=precio * item.cantidad,
            )
        )
        stock = (
            db.query(Inventario)
            .filter(
                Inventario.variante_id == item.variante_id,
                Inventario.sucursal_id == data.sucursal_id,
            )
            .first()
        )
        stock.cantidad_disponible -= item.cantidad

    # 4. Registrar pago
    if data.tipo_pago != "efectivo":
        db.add(
            Pago(
                pedido_id=pedido.id_pedido,
                monto=total,
                proveedor_pago="Punto de Venta",
                transaccion_id=f"CAJA-{pedido.id_pedido}",
                estado="aprobado",
            )
        )

    db.commit()
    db.refresh(pedido)
    return {"id_pedido": pedido.id_pedido, "total": float(total), "estado": "pagado"}


@router.post(
    "/digital/payment-intent", status_code=status.HTTP_201_CREATED,
    summary="Crear intención de pago para compra digital (CU10, RF19)",
)
def crear_pago_digital(
    data: VentaDigitalCreate,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    total = Decimal("0")
    for item in data.items:
        total += _precio_variante(db, item.variante_id) * item.cantidad

    # Usar sucursal 1 por defecto para validar stock (venta digital)
    sucursal_id = 1
    for item in data.items:
        _validar_stock(db, sucursal_id, item.variante_id, item.cantidad)

    intent = crear_intencion_pago(float(total), f"Pedido de {current.nombre}")
    return {"monto": float(total), **intent}


@router.post(
    "/digital/confirmar", status_code=status.HTTP_201_CREATED,
    summary="Confirmar y registrar compra digital tras pago aprobado",
)
def confirmar_compra_digital(
    data: VentaDigitalCreate,
    db: Session = Depends(get_db),
    current: Usuario = Depends(get_current_user),
):
    if not confirmar_pago_simulado():
        raise HTTPException(status_code=402, detail="Pago rechazado")

    sucursal_id = 1
    total = Decimal("0")
    for item in data.items:
        _validar_stock(db, sucursal_id, item.variante_id, item.cantidad)
        total += _precio_variante(db, item.variante_id) * item.cantidad

    pedido = Pedido(
        usuario_id=current.id_usuario,
        sucursal_id=sucursal_id,
        total=total,
        metodo_compra="digital",
        estado="pagado",
        tipo_pago="tarjeta_credito",
    )
    db.add(pedido)
    db.flush()

    for item in data.items:
        precio = _precio_variante(db, item.variante_id)
        db.add(
            PedidoItem(
                pedido_id=pedido.id_pedido,
                variante_id=item.variante_id,
                cantidad=item.cantidad,
                precio_unitario=precio,
                subtotal=precio * item.cantidad,
            )
        )
        stock = (
            db.query(Inventario)
            .filter(
                Inventario.variante_id == item.variante_id,
                Inventario.sucursal_id == sucursal_id,
            )
            .first()
        )
        stock.cantidad_disponible -= item.cantidad

    db.add(
        Pago(
            pedido_id=pedido.id_pedido,
            monto=total,
            proveedor_pago="STRIPE",
            transaccion_id=f"TXN-STRIPE-{pedido.id_pedido}",
            estado="aprobado",
        )
    )

    db.commit()
    db.refresh(pedido)
    return {"id_pedido": pedido.id_pedido, "total": float(total), "estado": "pagado"}


@router.get("/historial", summary="Historial de compras del usuario")
def historial(db: Session = Depends(get_db), current: Usuario = Depends(get_current_user)):
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == current.id_usuario)
        .order_by(Pedido.fecha_pedido.desc())
        .all()
    )
    return pedidos
