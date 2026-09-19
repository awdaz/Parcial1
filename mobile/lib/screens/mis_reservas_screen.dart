import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../models/reserva.dart';
import '../services/reserva_service.dart';

class MisReservasScreen extends StatefulWidget {
  const MisReservasScreen({super.key});

  @override
  State<MisReservasScreen> createState() => _MisReservasScreenState();
}

class _MisReservasScreenState extends State<MisReservasScreen> {
  List<Reserva> _reservas = [];
  bool _cargando = true;
  String? _error;
  int? _cancelandoId;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final lista = await ReservaService.misReservas();
      if (!mounted) return;
      setState(() {
        _reservas = lista;
        _cargando = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _cargando = false;
        _error = e is ApiException ? e.message : e.toString();
      });
    }
  }

  Future<void> _cancelar(Reserva reserva) async {
    final confirmado = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar reserva'),
        content: Text('¿Deseas cancelar la reserva #${reserva.idReserva}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    );
    if (confirmado != true || !mounted) return;

    setState(() => _cancelandoId = reserva.idReserva);
    try {
      await ReservaService.cancelar(reserva.idReserva);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reserva cancelada exitosamente')),
      );
      setState(() => _cancelandoId = null);
      await _cargar();
    } catch (e) {
      if (!mounted) return;
      setState(() => _cancelandoId = null);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : e.toString())),
      );
    }
  }

  bool _puedeCancelar(Reserva r) =>
      r.estado == 'pendiente' || r.estado == 'preparada';

  Color _colorEstado(String estado) {
    switch (estado) {
      case 'pendiente':
        return const Color(0xfff57c00);
      case 'preparada':
        return const Color(0xff1976d2);
      case 'completada':
        return const Color(0xff2e7d32);
      default:
        return const Color(0xff757575);
    }
  }

  String _fmtHora(String hora) => hora.length >= 5 ? hora.substring(0, 5) : hora;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mis reservas')),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _centroError()
              : _reservas.isEmpty
                  ? _vistaVacia()
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        for (final r in _reservas) _card(r),
                      ],
                    ),
    );
  }

  Widget _vistaVacia() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.event_note,
              size: 48,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 8),
            const Text('No tienes reservas activas.'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Explorar catálogo'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _centroError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline,
                color: Theme.of(context).colorScheme.error, size: 40),
            const SizedBox(height: 8),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _cargar,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _card(Reserva r) {
    final puedeCancelar = _puedeCancelar(r);
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Reserva #${r.idReserva}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _colorEstado(r.estado),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    r.estado.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _fila(Icons.event, 'Fecha de atención',
                '${r.fechaReserva} a las ${_fmtHora(r.horaAtencion)}'),
            _fila(Icons.store, 'Sucursal',
                '${r.sucursalNombre ?? '-'}${r.ciudadNombre != null ? ' (${r.ciudadNombre})' : ''}'),
            if (r.usuarioNombre != null)
              _fila(Icons.person_outline, 'Cliente', r.usuarioNombre!),
            const SizedBox(height: 8),
            Text('Prendas reservadas',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 4),
            for (final item in r.items)
              Padding(
                padding: const EdgeInsets.only(left: 8, bottom: 2),
                child: Text(
                  '${item.productoNombre ?? 'Prenda'}'
                  '${_specs(item)} x${item.cantidad}',
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            if (puedeCancelar) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                  ),
                  onPressed:
                      _cancelandoId != null ? null : () => _cancelar(r),
                  icon: _cancelandoId == r.idReserva
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.cancel_outlined),
                  label: Text(_cancelandoId == r.idReserva
                      ? 'Cancelando...'
                      : 'Cancelar reserva'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _specs(ReservaItem item) {
    final partes = [
      if (item.talla != null) 'Talla ${item.talla}',
      if (item.color != null) 'Color ${item.color}',
    ];
    return partes.isEmpty ? '' : ' (${partes.join(' · ')})';
  }

  Widget _fila(IconData icon, String label, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon,
              size: 17,
              color: Theme.of(context).colorScheme.outline),
          const SizedBox(width: 6),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.outline,
                    ),
                  ),
                  TextSpan(text: valor),
                ],
              ),
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}