import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { Ciudad, Sucursal, SucursalForm } from '../models/sucursal';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private http = inject(HttpClient);

  private sucursalesSig = signal<Sucursal[]>([]);
  private ciudadesSig = signal<Ciudad[]>([]);

  readonly sucursales = this.sucursalesSig.asReadonly();
  readonly ciudades = this.ciudadesSig.asReadonly();

  constructor() {
    this.cargar();
    this.cargarCiudades();
  }

  cargar(): void {
    this.http.get<Sucursal[]>(`${environment.apiUrl}/sucursales/`).subscribe({
      next: (lista) => this.sucursalesSig.set(lista),
      error: () => {},
    });
  }

  cargarTodas(): void {
    this.http
      .get<Sucursal[]>(`${environment.apiUrl}/sucursales/`, {
        params: { todas: 'true' },
      })
      .subscribe({
        next: (lista) => this.sucursalesSig.set(lista),
        error: () => this.cargar(),
      });
  }

  cargarCiudades(): void {
    this.http
      .get<Ciudad[]>(`${environment.apiUrl}/sucursales/ciudades`)
      .subscribe({
        next: (lista) => this.ciudadesSig.set(lista),
        error: () => {},
      });
  }

  crear(data: SucursalForm) {
    return this.http.post<Sucursal>(`${environment.apiUrl}/sucursales/`, data);
  }

  actualizar(id: number, data: Partial<SucursalForm> & { activo?: boolean }) {
    return this.http.patch<Sucursal>(`${environment.apiUrl}/sucursales/${id}`, data);
  }

  desactivar(id: number, forzar: boolean) {
    return this.http.delete<Sucursal>(`${environment.apiUrl}/sucursales/${id}`, {
      params: { forzar: String(forzar) },
    });
  }

  nombreDe(id: number | null | undefined): string {
    if (!id) return 'Sin sucursal';
    const s = this.sucursalesSig().find((x) => x.id_sucursal === id);
    return s ? s.nombre : `Sucursal ${id}`;
  }
}