import { Injectable, computed, signal } from '@angular/core';

export interface CarritoItem {
  variante_id: number;
  cantidad: number;
  nombre: string;
  sku: string;
  color?: string | null;
  talla?: string | null;
  precio: number;
  imagen_url?: string | null;
}

const CLAVE = 'fashionstore_carrito_reservas';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private itemsSig = signal<CarritoItem[]>(this.leer());

  readonly items = this.itemsSig.asReadonly();
  readonly totalPrendas = computed(() =>
    this.items().reduce((acc, i) => acc + i.cantidad, 0),
  );
  readonly vacio = computed(() => this.items().length === 0);

  agregar(item: CarritoItem): void {
    const lista = [...this.itemsSig()];
    const idx = lista.findIndex((i) => i.variante_id === item.variante_id);
    if (idx >= 0) {
      lista[idx] = {
        ...lista[idx],
        cantidad: lista[idx].cantidad + item.cantidad,
      };
    } else {
      lista.push(item);
    }
    this.itemsSig.set(lista);
    this.guardar();
  }

  cambiarCantidad(varianteId: number, cantidad: number): void {
    this.itemsSig.set(
      this.itemsSig().map((i) =>
        i.variante_id === varianteId
          ? { ...i, cantidad: Math.max(1, cantidad) }
          : i,
      ),
    );
    this.guardar();
  }

  quitar(varianteId: number): void {
    this.itemsSig.set(this.itemsSig().filter((i) => i.variante_id !== varianteId));
    this.guardar();
  }

  limpiar(): void {
    this.itemsSig.set([]);
    this.guardar();
  }

  private leer(): CarritoItem[] {
    try {
      const raw = localStorage.getItem(CLAVE);
      return raw ? (JSON.parse(raw) as CarritoItem[]) : [];
    } catch {
      return [];
    }
  }

  private guardar(): void {
    localStorage.setItem(CLAVE, JSON.stringify(this.itemsSig()));
  }
}