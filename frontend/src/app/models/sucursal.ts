export interface Sucursal {
  id_sucursal: number;
  ciudad_id: number;
  nombre: string;
  direccion: string;
  telefono?: string | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  activo: boolean;
}