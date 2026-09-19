import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { Reserva, ReservaCreate } from '../models/reservas';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private http = inject(HttpClient);

  crear(data: ReservaCreate) {
    return this.http.post<Reserva>(`${environment.apiUrl}/reservas/`, data);
  }

  misReservas() {
    return this.http.get<Reserva[]>(`${environment.apiUrl}/reservas/`);
  }

  getPendientes() {
    return this.http.get<Reserva[]>(`${environment.apiUrl}/reservas/pendientes`);
  }

  cancelar(id: number) {
    return this.http.patch<Reserva>(`${environment.apiUrl}/reservas/${id}/cancelar`, {});
  }

  preparar(id: number) {
    return this.http.patch<Reserva>(`${environment.apiUrl}/reservas/${id}/preparar`, {});
  }

  completar(id: number) {
    return this.http.patch<Reserva>(`${environment.apiUrl}/reservas/${id}/completar`, {});
  }
}