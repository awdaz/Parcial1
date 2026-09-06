export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria_id: number;
  temporada_id: number;
  coleccion_id?: number | null;
  proveedor_id: number;
  imagen_url?: string | null;
  modelo_3d_url?: string | null;
  activo: boolean;
}
