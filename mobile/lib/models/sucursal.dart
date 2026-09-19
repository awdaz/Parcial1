import 'ciudad.dart';

class Sucursal {
  final int idSucursal;
  final int ciudadId;
  final String nombre;
  final String direccion;
  final String? telefono;
  final String? horarioApertura;
  final String? horarioCierre;
  final bool activo;
  final Ciudad? ciudad;

  Sucursal({
    required this.idSucursal,
    required this.ciudadId,
    required this.nombre,
    required this.direccion,
    this.telefono,
    this.horarioApertura,
    this.horarioCierre,
    this.activo = true,
    this.ciudad,
  });

  factory Sucursal.fromJson(Map<String, dynamic> json) => Sucursal(
        idSucursal: json['id_sucursal'] as int,
        ciudadId: json['ciudad_id'] as int,
        nombre: json['nombre'] as String,
        direccion: json['direccion'] as String,
        telefono: json['telefono'] as String?,
        horarioApertura: json['horario_apertura'] as String?,
        horarioCierre: json['horario_cierre'] as String?,
        activo: json['activo'] as bool? ?? true,
        ciudad: json['ciudad'] == null
            ? null
            : Ciudad.fromJson(json['ciudad'] as Map<String, dynamic>),
      );
}