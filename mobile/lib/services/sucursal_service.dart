import '../api/api_client.dart';
import '../models/ciudad.dart';

class SucursalService {
  static Future<List<Ciudad>> ciudades() async {
    final data = await ApiClient.get('/sucursales/ciudades');
    return (data as List)
        .map((e) => Ciudad.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}