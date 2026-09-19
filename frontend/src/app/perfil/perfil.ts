import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../core/auth.service';
import { NavbarComponent } from '../shared/navbar';

const TELEFONO_REGEX = /^\+?[0-9()][0-9\s\-().]{6,19}$/;

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NavbarComponent,
  ],
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackbar = inject(MatSnackBar);

  readonly usuario = this.auth.usuario;

  cargando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(TELEFONO_REGEX)]],
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    const data = {
      nombre: this.form.value.nombre!.trim(),
      email: this.form.value.email!.trim(),
      telefono: this.form.value.telefono?.trim() || null,
    };

    this.auth.updateProfile(data).subscribe({
      next: () => {
        this.cargando.set(false);
        this.snackbar.open('Perfil actualizado correctamente', 'Cerrar', {
          duration: 4000,
        });
        this.cargarDatos();
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
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
    return 'No se pudo actualizar el perfil.';
  }

  descartar(): void {
    this.cargarDatos();
    this.error.set(null);
  }

  private cargarDatos(): void {
    const u = this.usuario();
    this.form.patchValue({
      nombre: u?.nombre ?? '',
      email: u?.email ?? '',
      telefono: u?.telefono ?? '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
