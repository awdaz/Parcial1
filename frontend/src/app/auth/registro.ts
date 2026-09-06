import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);

  cargando = false;
  ocultar = true;
  error: string | null = null;

  form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
    },
    { validators: this.coincidenContrasenas }
  );

  coincidenContrasenas(group: { get: (k: string) => { value: string } | null }) {
    const pass = group.get('contrasena')?.value;
    const confirm = group.get('confirmar')?.value;
    return pass === confirm ? null : { noCoinciden: true };
  }

  onRegistrar(): void {
    if (this.form.invalid) return;
    this.cargando = true;
    this.error = null;

    const data = {
      nombre: this.form.value.nombre!.trim(),
      email: this.form.value.email!,
      contrasena: this.form.value.contrasena!,
      telefono: this.form.value.telefono?.trim() || undefined,
    };

    this.auth.register(data).subscribe({
      next: () => {
        this.cargando = false;
        this.snackbar.open('Cuenta creada. Ahora puedes iniciar sesión.', 'Cerrar', {
          duration: 4000,
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err?.error?.detail?.toString() ?? 'No se pudo registrar la cuenta.';
      },
    });
  }
}
