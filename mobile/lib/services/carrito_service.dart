import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/carrito.dart';

class CarritoService {
  CarritoService._();

  static final CarritoService instance = CarritoService._();

  static const _clave = 'fashionstore_carrito_reservas';

  final List<CarritoItem> _items = [];
  bool _iniciado = false;

  List<CarritoItem> get items => List.unmodifiable(_items);
  int get totalPrendas => _items.fold(0, (acc, item) => acc + item.cantidad);
  bool get vacio => _items.isEmpty;

  Future<void> init() async {
    if (_iniciado) return;
    _iniciado = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_clave);
      if (raw == null || raw.isEmpty) return;
      final lista = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      _items.addAll(lista.map(CarritoItem.fromJson));
    } catch (_) {
      _items.clear();
    }
  }

  Future<void> agregar(CarritoItem item) async {
    await init();
    final idx = _items.indexWhere((i) => i.varianteId == item.varianteId);
    if (idx >= 0) {
      _items[idx].cantidad += item.cantidad;
    } else {
      _items.add(item);
    }
    await _guardar();
  }

  Future<void> cambiarCantidad(int varianteId, int cantidad) async {
    final idx = _items.indexWhere((i) => i.varianteId == varianteId);
    if (idx >= 0) {
      _items[idx].cantidad = cantidad < 1 ? 1 : cantidad;
      await _guardar();
    }
  }

  Future<void> quitar(int varianteId) async {
    _items.removeWhere((i) => i.varianteId == varianteId);
    await _guardar();
  }

  Future<void> limpiar() async {
    _items.clear();
    await _guardar();
  }

  Future<void> _guardar() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _clave,
      jsonEncode(_items.map((i) => i.toJson()).toList()),
    );
  }
}