export interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: string;
  sucursal_id?: number | null;
  fecha_registro?: string;
  activo: boolean;
}

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  contrasena: string;
  telefono?: string;
  rol?: string;
  sucursal_id?: number | null;
}
