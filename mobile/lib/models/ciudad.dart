class Ciudad {
  final int idCiudad;
  final String nombre;

  Ciudad({required this.idCiudad, required this.nombre});

  factory Ciudad.fromJson(Map<String, dynamic> json) => Ciudad(
        idCiudad: json['id_ciudad'] as int,
        nombre: json['nombre'] as String,
      );
}