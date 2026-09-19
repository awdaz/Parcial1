import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../core/auth.service';
import { SucursalService } from '../services/sucursal.service';
import { NavbarComponent } from '../shared/navbar';
import { Sucursal } from '../models/sucursal';

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NavbarComponent,
  ],
})
export class SucursalesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private autenticacion = inject(AuthService);
  private servicio = inject(SucursalService);
  private snackbar = inject(MatSnackBar);

  readonly isAdmin = this.autenticacion.isAdmin;
  readonly sucursales = this.servicio.sucursales;
  readonly ciudades = this.servicio.ciudades;

  readonly columnas = computed(() =>
    this.isAdmin()
      ? ['nombre', 'ciudad', 'direccion', 'telefono', 'horario', 'estado', 'acciones']
      : ['nombre', 'ciudad', 'direccion', 'telefono', 'horario'],
  );

  cargando = signal(false);
  error = signal<string | null>(null);
  editando = signal<Sucursal | null>(null);
  confirmandoBaja = signal<number | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    ciudad_id: [null as number | null, Validators.required],
    direccion: ['', [Validators.required, Validators.minLength(3)]],
    telefono: [''],
    horario_apertura: ['', Validators.required],
    horario_cierre: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.servicio.cargarTodas();
    } else {
      this.servicio.cargar();
    }
  }

  abrirNueva(): void {
    this.error.set(null);
    this.confirmandoBaja.set(null);
    this.editando.set(null);
    this.form.reset({
      ciudad_id: null,
      horario_apertura: '09:00',
      horario_cierre: '21:00',
    });
  }

  abrirEdicion(suc: Sucursal): void {
    this.error.set(null);
    this.confirmandoBaja.set(null);
    this.editando.set(suc);
    this.form.patchValue({
      nombre: suc.nombre,
      ciudad_id: suc.ciudad_id,
      direccion: suc.direccion,
      telefono: suc.telefono ?? '',
      horario_apertura: this.cortarHora(suc.horario_apertura),
      horario_cierre: this.cortarHora(suc.horario_cierre),
    });
  }

  cancelar(): void {
    this.editando.set(null);
    this.error.set(null);
    this.confirmandoBaja.set(null);
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    const datos = {
      nombre: this.form.value.nombre!.trim(),
      ciudad_id: this.form.value.ciudad_id!,
      direccion: this.form.value.direccion!.trim(),
      telefono: this.form.value.telefono?.trim() || null,
      horario_apertura: this.form.value.horario_apertura + ':00',
      horario_cierre: this.form.value.horario_cierre + ':00',
    };

    const editando = this.editando();
    const operacion = editando
      ? this.servicio.actualizar(editando.id_sucursal, datos)
      : this.servicio.crear(datos);

    operacion.subscribe({
      next: () => {
        this.cargando.set(false);
        this.snackbar.open(
          editando
            ? 'Sucursal actualizada correctamente'
            : 'Sucursal creada correctamente',
          'Cerrar',
          { duration: 4000 },
        );
        this.editando.set(null);
        this.servicio.cargarTodas();
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  desactivar(suc: Sucursal): void {
    this.error.set(null);
    this.confirmandoBaja.set(null);
    this.servicio.desactivar(suc.id_sucursal, false).subscribe({
      next: () => {
        this.snackbar.open('Sucursal desactivada correctamente', 'Cerrar', {
          duration: 4000,
        });
        this.servicio.cargarTodas();
      },
      error: (err) => {
        const mensaje = this.mensajeError(err);
        this.error.set(mensaje);
        this.confirmandoBaja.set(suc.id_sucursal);
      },
    });
  }

  confirmarBaja(suc: Sucursal): void {
    this.cargando.set(true);
    this.servicio.desactivar(suc.id_sucursal, true).subscribe({
      next: () => {
        this.cargando.set(false);
        this.confirmandoBaja.set(null);
        this.error.set(null);
        this.snackbar.open('Sucursal desactivada correctamente', 'Cerrar', {
          duration: 4000,
        });
        this.servicio.cargarTodas();
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  cortarHora(hora: string | null | undefined): string {
    return (hora ?? '').slice(0, 5);
  }

  nombreCiudad(suc: Sucursal): string {
    return suc.ciudad?.nombre ?? `Ciudad ${suc.ciudad_id}`;
  }

  sucursalEnConfirmacion(): Sucursal | null {
    const id = this.confirmandoBaja();
    if (id === null) return null;
    return this.sucursales().find((s) => s.id_sucursal === id) ?? null;
  }

  private mensajeError(err: unknown): string {
    const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length) {
      return detail
        .map((e) => (e as { msg?: string })?.msg)
        .filter(Boolean)
        .join('; ');
    }
    return 'No se pudo completar la operación.';
  }
}