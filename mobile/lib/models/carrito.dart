class CarritoItem {
  final int varianteId;
  int cantidad;
  final String nombre;
  final String sku;
  final String? color;
  final String? talla;
  final double precio;
  final String? imagenUrl;

  CarritoItem({
    required this.varianteId,
    required this.cantidad,
    required this.nombre,
    required this.sku,
    this.color,
    this.talla,
    required this.precio,
    this.imagenUrl,
  });

  Map<String, dynamic> toJson() => {
        'variante_id': varianteId,
        'cantidad': cantidad,
        'nombre': nombre,
        'sku': sku,
        'color': color,
        'talla': talla,
        'precio': precio,
        'imagen_url': imagenUrl,
      };

  factory CarritoItem.fromJson(Map<String, dynamic> json) => CarritoItem(
        varianteId: json['variante_id'] as int,
        cantidad: json['cantidad'] as int,
        nombre: json['nombre'] as String,
        sku: json['sku'] as String? ?? '',
        color: json['color'] as String?,
        talla: json['talla'] as String?,
        precio: (json['precio'] as num).toDouble(),
        imagenUrl: json['imagen_url'] as String?,
      );
}