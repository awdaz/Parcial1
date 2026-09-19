import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  ProfileUpdate,
  RegisterRequest,
  Usuario,
} from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly tokenKey = 'fashionstore_token';
  private readonly usuarioKey = 'fashionstore_usuario';

  private currentUser = signal<Usuario | null>(null);

  readonly usuario = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.rol === 'admin');
  readonly isEncargado = computed(() => this.currentUser()?.rol === 'encargado');
  readonly isCajero = computed(() => this.currentUser()?.rol === 'cajero');

  constructor() {
    this.restoreSession();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(creds: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, creds)
      .pipe(tap((res) => this.setSession(res)));
  }

  register(data: RegisterRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/auth/register`, data);
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${environment.apiUrl}/auth/me`);
  }

  updateProfile(data: ProfileUpdate): Observable<Usuario> {
    return this.http.patch<Usuario>(`${environment.apiUrl}/auth/me`, data).pipe(
      tap((usuario) => {
        localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
        this.currentUser.set(usuario);
      }),
    );
  }

  setSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.access_token);
    localStorage.setItem(this.usuarioKey, JSON.stringify(res.usuario));
    this.currentUser.set(res.usuario);
  }

  restoreSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    const raw = localStorage.getItem(this.usuarioKey);
    if (token && raw) {
      try {
        this.currentUser.set(JSON.parse(raw));
      } catch {
        this.clearSession();
      }
    }
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.getToken()) return;
    try {
      const usuario = await lastValueFrom(this.me());
      this.currentUser.set(usuario);
      localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
    } catch {
      this.clearSession();
    }
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.currentUser.set(null);
  }
}
