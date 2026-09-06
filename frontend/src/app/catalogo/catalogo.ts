import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { CatalogoService } from '../services/catalogo.service';
import { Categoria, Producto } from '../models/catalogo';
import { NavbarComponent } from '../shared/navbar';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NavbarComponent,
  ],
})
export class CatalogoComponent implements OnInit {
  private catalogo = inject(CatalogoService);
  private router = inject(Router);

  categorias: Categoria[] = [];
  productos: Producto[] = [];
  cargando = true;
  error: string | null = null;

  categoria = new FormControl<number | null>(null);
  busqueda = new FormControl<string>('');

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.catalogo.listarCategorias().subscribe({
      next: (c) => (this.categorias = c),
      error: () => {
        /* categorías opcionales */
      },
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = null;
    this.catalogo
      .listarProductos({
        categoria_id: this.categoria.value,
        q: this.busqueda.value || null,
      })
      .subscribe({
        next: (p) => {
          this.productos = p;
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
          this.error = 'No se pudo cargar el catálogo.';
          console.error(err);
        },
      });
  }

  onFiltroCategoria(): void {
    this.cargarProductos();
  }

  onBuscar(): void {
    this.cargarProductos();
  }

  verProducto(id: number): void {
    this.router.navigate(['/catalogo', id]);
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }
}
