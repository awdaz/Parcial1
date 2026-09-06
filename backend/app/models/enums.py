import enum


class RolUsuario(str, enum.Enum):
    admin = "admin"
    encargado = "encargado"
    cajero = "cajero"
    cliente = "cliente"


class TipoMovimiento(str, enum.Enum):
    entrada = "entrada"
    salida = "salida"
    reserva = "reserva"
    cancelacion_reserva = "cancelacion_reserva"
    venta = "venta"
    devolucion = "devolucion"
    ajuste = "ajuste"


class EstadoReserva(str, enum.Enum):
    pendiente = "pendiente"
    preparada = "preparada"
    completada = "completada"
    cancelada = "cancelada"


class EstadoPedido(str, enum.Enum):
    pendiente = "pendiente"
    pagado = "pagado"
    enviado = "enviado"
    entregado = "entregado"
    cancelado = "cancelado"


class MetodoCompra(str, enum.Enum):
    digital = "digital"
    presencial = "presencial"


class TipoPago(str, enum.Enum):
    tarjeta_debito = "tarjeta_debito"
    tarjeta_credito = "tarjeta_credito"
    qr = "qr"
    transferencia = "transferencia"
    efectivo = "efectivo"


class EstadoPago(str, enum.Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"
    reembolsado = "reembolsado"
