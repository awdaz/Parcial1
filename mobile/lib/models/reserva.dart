class ReservaItemCreate {
  final int varianteId;
  final int cantidad;

  ReservaItemCreate({required this.varianteId, required this.cantidad});

  Map<String, dynamic> toJson() =>
      {'variante_id': varianteId, 'cantidad': cantidad};
}

class ReservaCreate {
  final int sucursalId;
  final String fechaReserva;
  final String horaAtencion;
  final List<ReservaItemCreate> items;

  ReservaCreate({
    required this.sucursalId,
    required this.fechaReserva,
    required this.horaAtencion,
    required this.items,
  });

  Map<String, dynamic> toJson() => {
        'sucursal_id': sucursalId,
        'fecha_reserva': fechaReserva,
        'hora_atencion': horaAtencion,
        'items': items.map((e) => e.toJson()).toList(),
      };
}

class ReservaItem {
  final int idReservaItem;
  final int varianteId;
  final int cantidad;
  final String? productoNombre;
  final String? talla;
  final String? color;

  ReservaItem({
    required this.idReservaItem,
    required this.varianteId,
    required this.cantidad,
    this.productoNombre,
    this.talla,
    this.color,
  });

  factory ReservaItem.fromJson(Map<String, dynamic> json) {
    final variante = json['variante'] as Map<String, dynamic>?;
    final producto = json['producto'] as Map<String, dynamic>?;
    final talla = variante?['talla'] as Map<String, dynamic>?;
    final color = variante?['color'] as Map<String, dynamic>?;
    return ReservaItem(
      idReservaItem: json['id_reserva_item'] as int,
      varianteId: json['variante_id'] as int,
      cantidad: json['cantidad'] as int,
      productoNombre: producto?['nombre'] as String?,
      talla: talla?['nombre'] as String?,
      color: color?['nombre'] as String?,
    );
  }
}

class Reserva {
  final int idReserva;
  final int usuarioId;
  final int sucursalId;
  final String fechaReserva;
  final String horaAtencion;
  final String estado;
  final String? sucursalNombre;
  final String? ciudadNombre;
  final String? usuarioNombre;
  final List<ReservaItem> items;

  Reserva({
    required this.idReserva,
    required this.usuarioId,
    required this.sucursalId,
    required this.fechaReserva,
    required this.horaAtencion,
    required this.estado,
    this.sucursalNombre,
    this.ciudadNombre,
    this.usuarioNombre,
    this.items = const [],
  });

  factory Reserva.fromJson(Map<String, dynamic> json) {
    final sucursal = json['sucursal'] as Map<String, dynamic>?;
    final usuario = json['usuario'] as Map<String, dynamic>?;
    return Reserva(
      idReserva: json['id_reserva'] as int,
      usuarioId: json['usuario_id'] as int,
      sucursalId: json['sucursal_id'] as int,
      fechaReserva: json['fecha_reserva'] as String? ?? '',
      horaAtencion: json['hora_atencion'].toString(),
      estado: json['estado'] as String,
      sucursalNombre: sucursal?['nombre'] as String?,
      ciudadNombre:
          (sucursal?['ciudad'] as Map<String, dynamic>?)?['nombre'] as String?,
      usuarioNombre: usuario?['nombre'] as String?,
      items: (json['items'] as List? ?? [])
          .map((e) => ReservaItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}