import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { Sucursal } from '../models/sucursal';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private http = inject(HttpClient);

  private sucursalesSig = signal<Sucursal[]>([]);

  readonly sucursales = this.sucursalesSig.asReadonly();

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.http.get<Sucursal[]>(`${environment.apiUrl}/sucursales`).subscribe({
      next: (lista) => this.sucursalesSig.set(lista),
      error: () => {},
    });
  }

  nombreDe(id: number | null | undefined): string {
    if (!id) return 'Sin sucursal';
    const s = this.sucursalesSig().find((x) => x.id_sucursal === id);
    return s ? s.nombre : `Sucursal ${id}`;
  }
}