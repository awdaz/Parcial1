import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { Usuario, UsuarioAdminForm } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/usuarios`;

  listar(rol?: string) {
    return this.http.get<Usuario[]>(`${this.api}/`, {
      params: rol ? { rol } : {},
    });
  }

  crear(data: UsuarioAdminForm) {
    return this.http.post<Usuario>(`${this.api}/`, data);
  }

  actualizar(id: number, data: Partial<UsuarioAdminForm> & { activo?: boolean }, forzar = false) {
    return this.http.patch<Usuario>(`${this.api}/${id}`, data, {
      params: { forzar: String(forzar) },
    });
  }
}
