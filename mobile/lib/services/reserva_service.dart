import '../api/api_client.dart';
import '../models/reserva.dart';

class ReservaService {
  static Future<Reserva> crear(ReservaCreate data) async {
    final resp = await ApiClient.post('/reservas/', body: data.toJson());
    return Reserva.fromJson(resp as Map<String, dynamic>);
  }

  static Future<List<Reserva>> misReservas() async {
    final resp = await ApiClient.get('/reservas/');
    return (resp as List)
        .map((e) => Reserva.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Reserva> cancelar(int idReserva) async {
    final resp =
        await ApiClient.patch('/reservas/$idReserva/cancelar');
    return Reserva.fromJson(resp as Map<String, dynamic>);
  }
}