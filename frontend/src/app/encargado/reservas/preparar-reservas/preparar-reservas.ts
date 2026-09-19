import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth.service';
import { Reserva } from '../../../models/reservas';
import { ReservaService } from '../../../services/reserva.service';
import { NavbarComponent } from '../../../shared/navbar';

@Component({
  selector: 'app-preparar-reservas',
  templateUrl: './preparar-reservas.html',
  styleUrl: './preparar-reservas.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NavbarComponent,
  ],
})
export class PrepararReservasComponent implements OnInit {
  private reservasServ = inject(ReservaService);
  private snackbar = inject(MatSnackBar);

  readonly reservas = signal<Reserva[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly actualizandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reservasServ.getPendientes().subscribe({
      next: (r) => {
        this.reservas.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Error al cargar las reservas pendientes.');
      },
    });
  }

  itemLabel(item: { producto?: { nombre: string } | null; variante?: { talla?: { nombre: string } | null; color?: { nombre: string } | null } | null; cantidad: number }): string {
    const nombre = item.producto?.nombre ?? 'Prenda';
    const talla = item.variante?.talla?.nombre;
    const color = item.variante?.color?.nombre;
    const specs = [talla ? `Talla ${talla}` : '', color ? `Color ${color}` : '']
      .filter((s) => s)
      .join(' · ');
    return `${nombre}${specs ? ` (${specs})` : ''} ×${item.cantidad}`;
  }

  preparar(id: number): void {
    const ok = window.confirm('¿Confirmas que has separado físicamente las prendas y están listas?');
    if (!ok) return;
    this.actualizandoId.set(id);
    this.reservasServ.preparar(id).subscribe({
      next: () => {
        this.actualizandoId.set(null);
        this.snackbar.open('Reserva marcada como PREPARADA. Notificación enviada al cliente.', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err) => {
        this.actualizandoId.set(null);
        const detail = err?.error?.detail?.toString() ?? 'Error al preparar';
        this.snackbar.open(detail, 'Cerrar', { duration: 5000 });
      }
    });
  }

  completar(id: number): void {
    const ok = window.confirm('¿El cliente ya está aquí y entregaste las prendas?');
    if (!ok) return;
    this.actualizandoId.set(id);
    this.reservasServ.completar(id).subscribe({
      next: () => {
        this.actualizandoId.set(null);
        this.snackbar.open('Reserva marcada como COMPLETADA.', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err) => {
        this.actualizandoId.set(null);
        const detail = err?.error?.detail?.toString() ?? 'Error al completar';
        this.snackbar.open(detail, 'Cerrar', { duration: 5000 });
      }
    });
  }
  
  cancelarPorStock(id: number): void {
    const ok = window.confirm('¿Estás seguro de cancelar por falta de stock? Se liberarán las cantidades en el inventario.');
    if (!ok) return;
    this.actualizandoId.set(id);
    this.reservasServ.cancelar(id).subscribe({
      next: () => {
        this.actualizandoId.set(null);
        this.snackbar.open('Reserva CANCELADA por falta de stock.', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err) => {
        this.actualizandoId.set(null);
        const detail = err?.error?.detail?.toString() ?? 'Error al cancelar';
        this.snackbar.open(detail, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
