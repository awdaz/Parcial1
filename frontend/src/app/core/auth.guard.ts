import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() || auth.getToken()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/** Limita las pantallas de administración a usuarios con rol administrador. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.usuario()?.rol === 'admin'
    ? true
    : router.createUrlTree(['/dashboard']);
};
