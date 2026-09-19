import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login';
import { RegistroComponent } from './auth/registro';
import { DashboardComponent } from './dashboard/dashboard';
import { CatalogoComponent } from './catalogo/catalogo';
import { ProductoDetalleComponent } from './catalogo/producto-detalle';
import { ProntoComponent } from './pages/pronto';
import { PerfilComponent } from './perfil/perfil';
import { SucursalesComponent } from './sucursales/sucursales';
import { CatalogoAdminComponent } from './catalogo-admin/catalogo-admin';
import { UsuariosAdminComponent } from './usuarios-admin/usuarios-admin';
import { adminGuard, authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard],
  },
  {
    path: 'catalogo',
    component: CatalogoComponent,
    canActivate: [authGuard],
  },
  {
    path: 'catalogo/:id',
    component: ProductoDetalleComponent,
    canActivate: [authGuard],
  },
  {
    path: 'gestion/productos',
    component: CatalogoAdminComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'gestion/usuarios',
    component: UsuariosAdminComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'sucursales',
    component: SucursalesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'reservas',
    component: ProntoComponent,
    data: {
      titulo: 'Reservas',
      icon: 'inventory_2',
      desc: 'Gestiona tus reservas de prendas y su estado en tiempo real.',
    },
    canActivate: [authGuard],
  },
  {
    path: 'ventas',
    component: ProntoComponent,
    data: {
      titulo: 'Ventas / POS',
      icon: 'point_of_sale',
      desc: 'Registro de ventas presenciales y ventas en línea.',
    },
    canActivate: [authGuard],
  },
  {
    path: 'reportes',
    component: ProntoComponent,
    data: {
      titulo: 'Reportes',
      icon: 'insights',
      desc: 'Reportes de ventas, inventario y rendimiento por sucursal.',
    },
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
