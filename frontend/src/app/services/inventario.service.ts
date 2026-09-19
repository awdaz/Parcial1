import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { SucursalDisponibilidad } from '../models/catalogo';

export interface DisponibilidadFiltro {
  sucursal_id?: number | null;
  ciudad_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);

  private api = `${environment.apiUrl}/inventario`;

  disponibilidad(
    varianteId: number,
    filtro: DisponibilidadFiltro = {},
  ): Observable<SucursalDisponibilidad[]> {
    let params = new HttpParams();
    if (filtro.sucursal_id) params = params.set('sucursal_id', filtro.sucursal_id);
    if (filtro.ciudad_id) params = params.set('ciudad_id', filtro.ciudad_id);
    return this.http.get<SucursalDisponibilidad[]>(
      `${this.api}/disponibilidad`,
      { params: params.set('variante_id', varianteId) },
    );
  }
}