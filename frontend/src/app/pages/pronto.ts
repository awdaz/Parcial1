import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { NavbarComponent } from '../shared/navbar';

@Component({
  selector: 'app-pronto',
  templateUrl: './pronto.html',
  styleUrl: './pronto.scss',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, NavbarComponent],
})
export class ProntoComponent {
  private route = inject(ActivatedRoute);

  readonly titulo: string = this.route.snapshot.data['titulo'] ?? 'Módulo';
  readonly icon: string = this.route.snapshot.data['icon'] ?? 'construction';
  readonly desc: string =
    this.route.snapshot.data['desc'] ??
    'Esta sección está en construcción y estará disponible próximamente.';
}