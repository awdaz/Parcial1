import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Categoria, Producto } from '../models/catalogo';

export interface ProductoFiltro {
  categoria_id?: number | null;
  q?: string | null;
  precio_min?: number | null;
  precio_max?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${environment.apiUrl}/catalogo/categorias`);
  }

  listarProductos(filtro: ProductoFiltro = {}): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtro.categoria_id) params = params.set('categoria_id', filtro.categoria_id);
    if (filtro.q) params = params.set('q', filtro.q);
    if (filtro.precio_min != null) params = params.set('precio_min', filtro.precio_min);
    if (filtro.precio_max != null) params = params.set('precio_max', filtro.precio_max);

    return this.http.get<Producto[]>(`${environment.apiUrl}/catalogo/productos`, {
      params,
    });
  }

  verProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${environment.apiUrl}/catalogo/productos/${id}`);
  }
}
