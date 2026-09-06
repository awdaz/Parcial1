# FashionStore — Documento de creación

Plataforma inteligente de comercio electrónico para una cadena de tiendas de ropa.
Multitienencia: sede principal en Santa Cruz de la Sierra (Bolivia), con sucursales
en 6 ciudades. Desarrollada de forma incremental (PUDS).

**Stack:** Backend · FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 18 · JWT · Stripe (sandbox)

---

## 1. Base de Datos (PostgreSQL) — `database/`

Base de datos creada llamada **`fashionstore`** (18 tablas).

### Esquema — `01_creacion_base_datos.sql`
- **8 enums nativos**: `rol_usuario`, `tipo_movimiento`, `estado_reserva`,
  `estado_pedido`, `metodo_compra`, `tipo_pago`, `estado_pago`.
- **18 tablas**:
  | Módulo | Tablas |
  |--------|--------|
  | Ubicación | `ciudades`, `sucursales` |
  | Usuarios | `usuarios` |
  | Catálogo | `categorias`, `colores`, `tallas`, `temporadas`, `colecciones`, `proveedores`, `productos`, `producto_variantes` |
  | Inventario | `inventario`, `movimientos_inventario` |
  | Ventas | `reservas`, `reserva_items`, `pedidos`, `pedido_items`, `pagos` |
- Claves foráneas, UNIQUE compuestos, CHECK y índices de rendimiento.
- **Triggers**:
  - `trg_validar_stock_reserva` — evita reservar más del stock disponible.
  - `trg_reserva_item_insert` — reserva stock automáticamente al insertar ítems.
  - `trg_reserva_cancelada` — libera el stock al cancelar la reserva.
  - `trg_validar_sku` — valida el formato del SKU de cada variante.
  - `trg_pedido_pagado` — descuenta stock al confirmarse un pedido pagado.
- **Procedimientos almacenados**:
  - `sp_crear_reserva` (con ROLLBACK ante fallos), `sp_cancelar_reserva`,
    `sp_preparar_reserva`, `sp_completar_reserva`.
  - `sp_registrar_venta_presencial`, `sp_registrar_venta_digital`.
- **Función**: `fn_consultar_disponibilidad`.

### Población — `02_poblacion.sql`
Datos realistas de Bolivia:
- **6 ciudades** y **7 sucursales** (sucursal principal: *FashionStore Santa Cruz - Centro*).
- **19 usuarios** (1 admin, 5 encargados, 5 cajeros, 8 clientes).
- **18 productos**, **47 variantes** (talla × color), **7 categorías**, 6 tallas,
  8 colores, 4 temporadas, 4 colecciones, 5 proveedores.
- **224 registros de inventario** (incluye agotados, stock bajo y próximos a ingresar).
- **10 reservas** en distintos estados (pendiente, preparada, completada, cancelada).
- **14 pedidos** (digitales y presenciales), **18 ítems**, **14 pagos**
  (STRIPE, PAYPAL, LIBÉLULA, caja), **45 movimientos de inventario**.

> Nota: las contraseñas del seed están en texto plano (formato demo). El backend
> `verify_password` tolera tanto hash bcrypt como texto plano.

### Consultas — `03_consultas.sql`
30 consultas funcionales que cubren todos los módulos (para validación y reportes).

### Excel
- `generar_excel.py` + `fashionstore_poblacion.xlsx` — las 18 tablas pobladas
  exportadas en 18 hojas de Excel.

---

## 2. Backend (FastAPI) — `backend/`

### Estructura
```
backend/
├── requirements.txt
├── alembic.ini
├── .env.example
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/            # migración inicial pendiente (baseline)
└── app/
    ├── main.py              # app FastAPI + CORS + router
    ├── api/v1/
    │   ├── router.py        # agrega los 8 módulos de endpoints
    │   └── endpoints/       # auth, usuarios, sucursales, catalogo,
    │                        #   inventario, reservas, ventas, ia
    ├── core/                # config, security (JWT+bcrypt), dependencies (roles)
    ├── db/                  # base.py (engine/Base), session.py (get_db)
    ├── models/              # 18 modelos ORM sincronizados al esquema
    ├── schemas/             # Pydantic (usuario, comercio)
    └── services/            # stripe_service.py (pagos sandbox)
```

### Modelos ORM (18) — `app/models/`
Coinciden 1:1 con las tablas de PostgreSQL, usando enums nativos.
- `enums.py` — todos los enums del esquema.
- `ubicacion.py` — Ciudad, Sucursal.
- `usuario.py` — Usuario.
- `catalogo.py` — Categoria, Color, Talla, Temporada, Coleccion, Proveedor,
  Producto, ProductoVariante.
- `inventario.py` — Inventario, MovimientoInventario.
- `ventas.py` — Reserva, ReservaItem, Pedido, PedidoItem, Pago.

### Endpoints implementados
| Módulo | Ruta base | Endpoints / función |
|--------|-----------|---------------------|
| **Auth** | `/api/v1/auth` | register, login (JWT), login/form (OAuth2), me |
| **Usuarios** | `/api/v1/usuarios` | list, get, update |
| **Sucursales** | `/api/v1/sucursales` | list, get, create |
| **Catálogo** | `/api/v1/catalogo` | categorías, productos (con filtros), detalle, crear/actualizar producto, agregar variante |
| **Inventario** | `/api/v1/inventario` | disponibilidad por sucursal (RF08), listar, agotados/stock bajo |
| **Reservas** | `/api/v1/reservas` | crear (CU8), listar (CU9), detalle, cancelar, preparar (CU18), completar |
| **Ventas** | `/api/v1/ventas` | presencial (caja), digital con Stripe (payment-intent + confirmar), historial |
| **IA** | `/api/v1/ia` | recomendaciones (CU17), recomendaciones por sucursal |

Roles: `admin`, `encargado`, `cajero`, `cliente` — protegidos por dependencias
`admin_required`, `encargado_required`, `cajero_required`, `get_current_user`.

### Seguridad
- Contraseñas con bcrypt (Passlib).
- Tokens JWT (python-jose) con `SECRET_KEY` y expiración configurable.
- Autenticación mediante `OAuth2PasswordBearer` con `tokenUrl=/api/v1/auth/login`.

### Integración Stripe (sandbox) — `app/services/stripe_service.py`
- `crear_intencion_pago()` — PaymentIntent; modo simulado si no hay clave real.
- Ventas digitales: `payment-intent` → cliente confirma → `confirmar` registra el pedido.

---

## 3. Frontend (Angular) — `frontend/`

Plataforma web Angular (standalone components) + Angular Material.

### Estructura
```
frontend/
├── Dockerfile               # multi-etapa (node:22 build → nginx)
├── nginx.conf               # SPA routing + proxy /api/v1 → backend
├── angular.json             # tema, fileReplacements producción
└── src/
    ├── app/
    │   ├── core/            # auth.service, auth.guard, token.interceptor
    │   ├── models/          # usuario.ts, catalogo.ts
    │   ├── services/        # catalogo.service.ts
    │   ├── auth/            # login, registro
    │   ├── dashboard/       # resumen según rol
    │   ├── catalogo/        # listado con filtros, detalle de producto
    │   └── shared/          # navbar
    └── environments/        # environment.ts (dev) + environment.prod.ts (Docker)
```

### Funcionalidad
- **Login / Registro** de usuarios con JWT (store en localStorage).
- **Dashboard** según rol (admin/encargado/cajero/cliente).
- **Catálogo**: listado con filtros (categoría/búsqueda) + detalle de producto.
- **Interceptor de token** (`Authorization: Bearer`) para todas las peticiones.
- **Guard de rutas** que protege dashboard y catálogo.
- URLs: dev `http://127.0.0.1:8000/api/v1` (CORS); prod `/api/v1` (proxy nginx).

---

## 4. Docker (despliegue completo) — raíz

**`docker-compose.yml`** levanta el stack completo:
| Servicio | Imagen / build | Puerto | Notas |
|----------|----------------|--------|-------|
| `db` | `postgres:18-alpine` | 5432 | Base poblada automáticamente con `database/01_creacion_base_datos.sql` + `02_poblacion.sql` |
| `backend` | `backend/Dockerfile` | 8000 | FastAPI + Uvicorn |
| `frontend` | `frontend/Dockerfile` | 80 | Angular compilado servido por nginx; proxya `/api/v1` → backend |

Archivos:
- `backend/Dockerfile` + `backend/.dockerignore`
- `frontend/Dockerfile` (node:22-alpine → nginx:alpine) + `frontend/.dockerignore`
- `frontend/nginx.conf` (SPA `try_files` + `proxy_pass /api/v1`)
- `src/environments/environment.prod.ts` con `apiUrl: '/api/v1'`

Comandos:
```
docker compose up --build       # levantar todo
docker compose down             # detener
docker compose down -v          # detener y borrar datos
```

> Nota: requiere Docker Desktop corriendo (no fue construido durante el
> desarrollo local por estar el daemon apagado).

---

## 5. Documentación — `docs/`
- `base-de-datos.md` — diseño completo de la base de datos.
- `base-de-datos-ciclo1.md` — base de datos por módulos según casos de uso.

---

## 6. Bugs corregidos durante la verificación en vivo
1. **Relación ORM inválida** — `Inventario.movimientos` no tenía FK directa con
   `movimientos_inventario` (se relaciona por `(variante_id, sucursal_id)`).
   Se eliminó la relación problemática en `models/inventario.py`.
2. **Contraseñas en texto plano** — el seed usa texto plano; `verify_password` en
   `core/security.py` ahora tolera tanto hash bcrypt como texto plano.
3. **Serialización de catálogo** — `response_model=list[object]` no serializaba
   instancias ORM (PydanticSerializationError). Se reemplazó por
   `ProductoOut` / `CategoriaOut` en `endpoints/catalogo.py`.
4. **`openapi.json`** — la app expone OpenAPI en `/api/v1/openapi.json`
   (no en la ruta raíz); `/docs` y `/redoc` funcionan normalmente.

---

## 7. Estado de verificación
El servidor se probó en vivo y se confirmaron:
- Health check en `/`.
- Login JWT (cliente) → `/auth/me`.
- Catálogo: 18 productos, 7 categorías, detalle de producto.
- Inventario: disponibilidad de una variante en las 7 sucursales.
- IA: 6 recomendaciones por historial + temporada.

---

## 8. Pendiente
- Configurar la migración **Alembic** (baseline del esquema ya existente).
- **App Flutter + AR** (no iniciada).
- Validar el build de Docker cuando el daemon de Docker Desktop esté activo.
