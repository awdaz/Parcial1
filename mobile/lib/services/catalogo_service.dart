import '../api/api_client.dart';
import '../models/producto.dart';

class CatalogoService {
  static Future<List<Producto>> listarProductos() async {
    final data = await ApiClient.get('/catalogo/productos');
    return (data as List)
        .map((e) => Producto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Producto> verProducto(int id) async {
    final data = await ApiClient.get('/catalogo/productos/$id');
    return Producto.fromJson(data as Map<String, dynamic>);
  }
}