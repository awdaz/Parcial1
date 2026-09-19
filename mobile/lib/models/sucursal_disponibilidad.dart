class SucursalDisponibilidad {
  final int varianteId;
  final int sucursalId;
  final String nombreSucursal;
  final String ciudad;
  final int cantidadDisponible;
  final int cantidadReservada;
  final int cantidadRecibida;
  final int stockMinimo;
  final String estado;

  SucursalDisponibilidad({
    required this.varianteId,
    required this.sucursalId,
    required this.nombreSucursal,
    required this.ciudad,
    required this.cantidadDisponible,
    required this.cantidadReservada,
    required this.cantidadRecibida,
    required this.stockMinimo,
    required this.estado,
  });

  factory SucursalDisponibilidad.fromJson(Map<String, dynamic> json) =>
      SucursalDisponibilidad(
        varianteId: json['variante_id'] as int,
        sucursalId: json['sucursal_id'] as int,
        nombreSucursal: json['nombre_sucursal'] as String,
        ciudad: json['ciudad'] as String,
        cantidadDisponible: json['cantidad_disponible'] as int,
        cantidadReservada: json['cantidad_reservada'] as int,
        cantidadRecibida: json['cantidad_recibida'] as int,
        stockMinimo: json['stock_minimo'] as int,
        estado: json['estado'] as String,
      );
}