import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { CatalogoService } from '../services/catalogo.service';
import { Producto } from '../models/catalogo';
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
    NavbarComponent,
  ],
})
export class ProductoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogo = inject(CatalogoService);

  producto: Producto | null = null;
  cargando = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalogo.verProducto(id).subscribe({
      next: (p) => {
        this.producto = p;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err?.error?.detail?.toString() ?? 'No se pudo cargar el producto.';
      },
    });
  }

  volver(): void {
    history.back();
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }
}
