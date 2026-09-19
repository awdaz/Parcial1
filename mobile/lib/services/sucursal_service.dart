import '../api/api_client.dart';
import '../models/ciudad.dart';
import '../models/sucursal.dart';

class SucursalService {
  static Future<List<Ciudad>> ciudades() async {
    final data = await ApiClient.get('/sucursales/ciudades');
    return (data as List)
        .map((e) => Ciudad.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<Sucursal>> sucursales() async {
    final data = await ApiClient.get('/sucursales/', auth: false);
    return (data as List)
        .map((e) => Sucursal.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}