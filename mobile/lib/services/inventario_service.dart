import '../api/api_client.dart';
import '../models/sucursal_disponibilidad.dart';

class InventarioService {
  static Future<List<SucursalDisponibilidad>> disponibilidad(
    int varianteId, {
    int? ciudadId,
  }) async {
    final query = <String, String>{
      'variante_id': '$varianteId',
      if (ciudadId != null) 'ciudad_id': '$ciudadId',
    };
    final data = await ApiClient.get('/inventario/disponibilidad', query: query);
    return (data as List)
        .map((e) => SucursalDisponibilidad.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}