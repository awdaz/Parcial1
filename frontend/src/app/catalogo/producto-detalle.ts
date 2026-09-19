import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { CatalogoService } from '../services/catalogo.service';
import { InventarioService } from '../services/inventario.service';
import { SucursalService } from '../services/sucursal.service';
import { Color, Producto, ProductoVariante, SucursalDisponibilidad, Talla } from '../models/catalogo';
import { NavbarComponent } from '../shared/navbar';

@Component({
  selector: 'app-producto-detalle',
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.scss',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    NavbarComponent,
  ],
})
export class ProductoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogo = inject(CatalogoService);
  private inventario = inject(InventarioService);
  private sucursalServicio = inject(SucursalService);

  readonly producto = signal<Producto | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly colores = signal<Color[]>([]);
  readonly tallas = signal<Talla[]>([]);
  readonly colorSel = signal<number | null>(null);
  readonly tallaSel = signal<number | null>(null);
  readonly varianteSel = signal<ProductoVariante | null>(null);

  readonly disponibilidad = signal<SucursalDisponibilidad[]>([]);
  readonly ciudades = this.sucursalServicio.ciudades;
  readonly ciudadSel = signal<number | null>(null);
  readonly cargandoDisp = signal(false);
  readonly errorDisp = signal<string | null>(null);
  readonly columnas = ['sucursal', 'ciudad', 'disponible', 'reservada', 'recibida', 'stockMinimo', 'estado'];

  ngOnInit(): void {
    this.sucursalServicio.cargar();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalogo.verProducto(id).subscribe({
      next: (p) => {
        this.producto.set(p);
        this.cargando.set(false);
        this.prepararVariantes();
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.error?.detail?.toString() ?? 'No se pudo cargar el producto.',
        );
      },
    });
  }

  onColor(id: number | null): void {
    this.colorSel.set(id);
    this.cargarDisponibilidad();
  }

  onTalla(id: number | null): void {
    this.tallaSel.set(id);
    this.cargarDisponibilidad();
  }

  onCiudad(id: number | null): void {
    this.ciudadSel.set(id);
    this.cargarDisponibilidad();
  }

  volver(): void {
    history.back();
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }

  private prepararVariantes(): void {
    const variantes = this.producto()?.variantes ?? [];
    const colores: Color[] = [];
    const tallas: Talla[] = [];
    for (const v of variantes) {
      if (v.color && !colores.some((c) => c.id_color === v.color!.id_color)) {
        colores.push(v.color);
      }
      if (v.talla && !tallas.some((t) => t.id_talla === v.talla!.id_talla)) {
        tallas.push(v.talla);
      }
    }
    this.colores.set(colores);
    this.tallas.set(tallas);
    if (colores.length) this.colorSel.set(colores[0].id_color);
    if (tallas.length) this.tallaSel.set(tallas[0].id_talla);
    this.cargarDisponibilidad();
  }

  private cargarDisponibilidad(): void {
    const variante = this.encontrarVariante();
    this.varianteSel.set(variante);
    if (!variante) {
      this.disponibilidad.set([]);
      this.errorDisp.set(null);
      return;
    }
    this.cargandoDisp.set(true);
    this.errorDisp.set(null);
    this.inventario.disponibilidad(variante.id_variante, { ciudad_id: this.ciudadSel() }).subscribe({
      next: (lista) => {
        this.disponibilidad.set(lista);
        this.cargandoDisp.set(false);
      },
      error: (err) => {
        this.cargandoDisp.set(false);
        const status = err?.status as number | undefined;
        this.errorDisp.set(
          status === 401
            ? 'Inicia sesión para consultar disponibilidad por sucursal.'
            : 'Error al cargar disponibilidad, intente de nuevo.',
        );
      },
    });
  }

  private encontrarVariante(): ProductoVariante | null {
    const colorId = this.colorSel();
    const tallaId = this.tallaSel();
    if (colorId == null || tallaId == null) return null;
    return (
      (this.producto()?.variantes ?? []).find(
        (v) => v.color_id === colorId && v.talla_id === tallaId,
      ) ?? null
    );
  }
}