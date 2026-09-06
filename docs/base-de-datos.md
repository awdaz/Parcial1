# Base de Datos - FashionStore

**Sistemas II** - Plataforma Inteligente de Comercio Electrónico para Tienda de Ropa con Vestidores Virtuales Vía Realidad Aumentada.

**Base de datos:** PostgreSQL (Sistema Gestor de Base de Datos Relacional)

---

## 1. Diagrama Entidad-Relación (Resumen)

```
                     ┌─────────────┐
                     │    CIUDAD   │
                     └──────┬──────┘
                            │ 1:N
                     ┌──────▼──────┐
                     │   SUCURSAL  │
                     └──────┬──────┘
                            │ 1:N
              ┌─────────────┴─────────────┐
              │                           │
        ┌─────▼──────┐              ┌─────▼──────┐
        │ INVENTARIO │              │ RESERVA    │
        └─────┬──────┘              └─────┬──────┘
              │                           │
              │ 1:N                       │ 1:N
        ┌─────▼──────────────┐     ┌──────▼────────┐
        │ PRODUCTO_VARIANTE  │     │ RESERVA_ITEM  │
        └─────┬──────────────┘     └──────┬────────┘
              │                           │
              │ 1:N                       │ 1:N
        ┌─────▼──────┐              ┌─────▼──────┐
        │  PEDIDO_ITEM│              │   PEDIDO   │
        └─────┬──────┘              └─────┬──────┘
              │                           │
     ┌────────┴─────────┐                 │
     │                  │                 │
┌────▼──────┐      ┌────▼──────┐     ┌────▼──────┐
│ MOVIMIENTO│      │  PRODUCTO │     │  PAGO     │
│ INVENTARIO│      └────┬──────┘     └───────────┘
└───────────┘           │
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
┌────▼──────┐     ┌─────▼──────┐     ┌─────▼──────┐
│ CATEGORIA │     │  TEMPORADA │     │ COLLECCIÓN │
└───────────┘     └────────────┘     └────────────┘
     ┌──────────────────┐
     │                  │
┌────▼──────┐     ┌─────▼──────┐     ┌─────▼──────┐
│  COLOR    │     │   TALLA    │     │ PROVEEDOR  │
└───────────┘     └────────────┘     └────────────┘
```

---

## 2. Tablas

---

### 2.1 USUARIO (`usuarios`)

Almacena la información de todos los usuarios del sistema: clientes, empleados (encargados de sucursal, cajeros) y administradores.

| Campo           | Tipo            | Restricciones                 | Descripción                                          |
|-----------------|-----------------|-------------------------------|------------------------------------------------------|
| `id_usuario`    | SERIAL          | PK                             | Identificador único del usuario                       |
| `nombre`        | VARCHAR(100)    | NOT NULL                      | Nombre completo del usuario                          |
| `email`         | VARCHAR(150)    | NOT NULL, UNIQUE              | Correo electrónico (usado para login)                |
| `telefono`      | VARCHAR(20)     | NULL                          | Teléfono de contacto                                 |
| `contrasena`    | VARCHAR(255)    | NOT NULL                      | Hash de la contraseña (segura, RNF01)                |
| `rol`           | ENUM            | NOT NULL                      | `admin`, `encargado`, `cajero`, `cliente`            |
| `sucursal_id`   | INTEGER         | FK → `sucursales.id_sucursal` | Sucursal a la que pertenece (para empleados)         |
| `fecha_registro`| TIMESTAMP       | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Fecha de alta del usuario                        |
| `activo`        | BOOLEAN         | NOT NULL, DEFAULT `TRUE`      | Indica si la cuenta está activa                      |

> **Nota:** `sucursal_id` es `NULL` para clientes y administradores globales; solo empleados (encargado/cajero) tienen sucursal asignada.

---

### 2.2 CIUDAD (`ciudades`)

Representa las ciudades donde la cadena tiene presencia.

| Campo      | Tipo         | Restricciones | Descripción                         |
|------------|--------------|---------------|-------------------------------------|
| `id_ciudad`| SERIAL       | PK            | Identificador único de la ciudad    |
| `nombre`   | VARCHAR(100) | NOT NULL, UNIQUE | Nombre de la ciudad              |

---

### 2.3 SUCURSAL (`sucursales`)

Representa cada tienda física de la cadena, ubicada en una ciudad.

| Campo         | Tipo           | Restricciones                | Descripción                       |
|---------------|----------------|------------------------------|-----------------------------------|
| `id_sucursal` | SERIAL         | PK                           | Identificador único de la tienda  |
| `ciudad_id`   | INTEGER        | FK → `ciudades.id_ciudad`    | Ciudad donde se ubica la sucursal |
| `nombre`      | VARCHAR(150)   | NOT NULL                     | Nombre de la sucursal             |
| `direccion`   | VARCHAR(255)   | NOT NULL                     | Dirección física                  |
| `telefono`    | VARCHAR(20)    | NULL                         | Teléfono de la sucursal           |
| `horario_apertura` | TIME      | NOT NULL                     | Hora de apertura                  |
| `horario_cierre`   | TIME      | NOT NULL                     | Hora de cierre                    |
| `activo`      | BOOLEAN        | NOT NULL, DEFAULT `TRUE`     | Indica si la sucursal está operativa |

---

### 2.4 CATEGORÍA (`categorias`)

Clasificación de las prendas según su tipo.

| Campo         | Tipo          | Restricciones | Descripción                    |
|---------------|---------------|---------------|--------------------------------|
| `id_categoria`| SERIAL        | PK            | Identificador único            |
| `nombre`      | VARCHAR(100)  | NOT NULL, UNIQUE | Nombre de la categoría (Ej: Camiseta, Pantalón, Vestido, Abrigo) |
| `descripcion` | TEXT          | NULL          | Descripción opcional           |

---

### 2.5 COLOR (`colores`)

Paleta de colores disponibles para las prendas.

| Campo       | Tipo         | Restricciones | Descripción             |
|-------------|--------------|---------------|-------------------------|
| `id_color`  | SERIAL       | PK            | Identificador único     |
| `nombre`    | VARCHAR(50)  | NOT NULL, UNIQUE | Nombre del color    |
| `codigo_hex`| VARCHAR(7)   | NOT NULL      | Código hexadecimal (Ej: `#FF0000`) |

---

### 2.6 TALLA (`tallas`)

Tallas disponibles para las prendas.

| Campo     | Tipo        | Restricciones | Descripción                       |
|-----------|-------------|---------------|-----------------------------------|
| `id_talla`| SERIAL      | PK            | Identificador único               |
| `nombre`  | VARCHAR(10) | NOT NULL, UNIQUE | Etiqueta de la talla (Ej: S, M, L, XL, 36, 40) |

---

### 2.7 TEMPORADA (`temporadas`)

Temporadas comerciales de la ropa.

| Campo          | Tipo        | Restricciones | Descripción                            |
|----------------|-------------|---------------|----------------------------------------|
| `id_temporada` | SERIAL      | PK            | Identificador único                    |
| `nombre`       | VARCHAR(100)| NOT NULL, UNIQUE | Nombre de la temporada (Ej: Primavera-Verano, Otoño-Invierno, Escolar) |
| `fecha_inicio` | DATE        | NOT NULL      | Fecha de inicio de la temporada        |
| `fecha_fin`    | DATE        | NOT NULL      | Fecha de fin de la temporada           |

---

### 2.8 COLECCIÓN (`colecciones`)

Colecciones lanzadas por la empresa, asociadas a una temporada.

| Campo           | Tipo               | Restricciones | Descripción                        |
|-----------------|--------------------|---------------|------------------------------------|
| `id_coleccion`  | SERIAL             | PK            | Identificador único                |
| `temporada_id`  | INTEGER            | FK → `temporadas.id_temporada` | Temporada a la que pertenece |
| `nombre`        | VARCHAR(150)       | NOT NULL, UNIQUE | Nombre de la colección (Ej: Colección Primavera 2026, Nuevas Colecciones) |
| `descripcion`   | TEXT               | NULL          | Descripción de la colección        |
| `es_promocional`| BOOLEAN            | NOT NULL, DEFAULT `FALSE` | Indica si es una temporada promocional especial |

---

### 2.9 PROVEEDOR (`proveedores`)

Entidades externas que suministran las prendas.

| Campo            | Tipo          | Restricciones | Descripción                 |
|------------------|---------------|---------------|-----------------------------|
| `id_proveedor`   | SERIAL        | PK            | Identificador único         |
| `nombre`         | VARCHAR(150)  | NOT NULL, UNIQUE | Razón social del proveedor|
| `contacto`       | VARCHAR(100)  | NULL          | Nombre de la persona de contacto |
| `telefono`       | VARCHAR(20)   | NULL          | Teléfono                    |
| `email`          | VARCHAR(150)  | NULL          | Correo electrónico          |
| `direccion`      | VARCHAR(255)  | NULL          | Dirección del proveedor     |

---

### 2.10 PRODUCTO (`productos`)

Prendas de vestir ofrecidas por la tienda. Cada producto base se comercializa en varias variantes (talla × color).

| Campo              | Tipo               | Restricciones | Descripción                         |
|--------------------|--------------------|---------------|-------------------------------------|
| `id_producto`      | SERIAL             | PK            | Identificador único                 |
| `nombre`           | VARCHAR(150)       | NOT NULL      | Nombre de la prenda                 |
| `descripcion`      | TEXT               | NULL          | Descripción detallada               |
| `precio`           | NUMERIC(10,2)      | NOT NULL      | Precio unitario en moneda local     |
| `categoria_id`     | INTEGER            | FK → `categorias.id_categoria` | Categoría de la prenda      |
| `temporada_id`     | INTEGER            | FK → `temporadas.id_temporada` | Temporada a la que corresponde |
| `coleccion_id`     | INTEGER            | FK → `colecciones.id_coleccion` (NULL) | Colección a la que pertenece |
| `proveedor_id`     | INTEGER            | FK → `proveedores.id_proveedor` | Proveedor que la suministra |
| `imagen_url`       | VARCHAR(255)       | NULL          | URL de la imagen principal          |
| `modelo_3d_url`    | VARCHAR(255)       | NULL          | URL del modelo 3D/AR para vestidor virtual |
| `activo`           | BOOLEAN            | NOT NULL, DEFAULT `TRUE` | Disponible para la venta      |

---

### 2.11 VARIANTE DE PRODUCTO (`producto_variantes`)

Cada variante combina un producto con una talla y un color específicos. Es la unidad que se rastrea en inventario.

| Campo           | Tipo          | Restricciones | Descripción                          |
|-----------------|---------------|---------------|--------------------------------------|
| `id_variante`   | SERIAL        | PK            | Identificador único                  |
| `producto_id`   | INTEGER       | FK → `productos.id_producto` | Producto base               |
| `color_id`      | INTEGER       | FK → `colores.id_color`      | Color de la variante          |
| `talla_id`      | INTEGER       | FK → `tallas.id_talla`       | Talla de la variante          |
| `sku`           | VARCHAR(50)   | NOT NULL, UNIQUE | Código interno de la variante  |
| `precio_extra`  | NUMERIC(10,2) | NOT NULL, DEFAULT `0` | Sobreprecio de la variante |

> **Restricción de unicidad compuesta:** (`producto_id`, `color_id`, `talla_id`) debe ser único.

---

### 2.12 INVENTARIO (`inventario`)

Cantidad de unidades de cada variante disponible en cada sucursal. Es la tabla central que controla las existencias.

| Campo                | Tipo           | Restricciones | Descripción                                    |
|----------------------|----------------|---------------|------------------------------------------------|
| `id_inventario`      | SERIAL         | PK            | Identificador único                            |
| `variante_id`        | INTEGER        | FK → `producto_variantes.id_variante` | Variante     |
| `sucursal_id`        | INTEGER        | FK → `sucursales.id_sucursal`    | Sucursal               |
| `cantidad_disponible`| INTEGER        | NOT NULL, CHECK (≥ 0) | Unidades a la venta (no reservadas)  |
| `cantidad_reservada` | INTEGER        | NOT NULL, DEFAULT `0`, CHECK (≥ 0) | Unidades apartadas por reservas |
| `cantidad_recibida`  | INTEGER        | NOT NULL, DEFAULT `0` | Unidades enviadas por proveedor aún por procesar (próximas a ingresar) |
| `stock_minimo`       | INTEGER        | NOT NULL, DEFAULT `0` | Nivel mínimo de reposición (alerta)  |

> **Regla de negocio:** `cantidad_disponible` se calcula considerando las existencias recibidas menos las reservadas y vendidas. El estado de la prenda se deriva:
> - **Agotada** (`out_of_stock`) → `cantidad_disponible = 0`
> - **Disponible** (`available`) → `cantidad_disponible > 0`
> - **Reservada** (`reserved`) → `cantidad_reservada > 0`
> - **Próxima a ingresar** (`incoming`) → `cantidad_recibida > 0`
>
> **Relación de unicidad compuesta:** (`variante_id`, `sucursal_id`) único.

---

### 2.13 MOVIMIENTO DE INVENTARIO (`movimientos_inventario`)

Registro histórico de todas las operaciones que afectan el inventario (entradas, salidas, ajustes).

| Campo              | Tipo          | Restricciones | Descripción                            |
|--------------------|---------------|---------------|----------------------------------------|
| `id_movimiento`    | SERIAL        | PK            | Identificador único                    |
| `variante_id`      | INTEGER       | FK → `producto_variantes.id_variante` | Variante afectada |
| `sucursal_id`      | INTEGER       | FK → `sucursales.id_sucursal` | Sucursal              |
| `tipo_movimiento`  | ENUM          | NOT NULL      | `entrada`, `salida`, `reserva`, `cancelacion_reserva`, `venta`, `devolucion`, `ajuste` |
| `cantidad`         | INTEGER       | NOT NULL      | Cantidad (positiva o negativa)          |
| `referencia_id`    | INTEGER       | NULL          | ID de la transacción que lo originó (pedido/reserva) |
| `observacion`      | TEXT          | NULL          | Nota adicional                         |
| `fecha_movimiento` | TIMESTAMP     | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Fecha del movimiento |

---

### 2.14 RESERVA (`reservas`)

Reserva de varias prendas que un cliente hace para probarlas en un vestidor físico de una sucursal.

| Campo               | Tipo               | Restricciones | Descripción                          |
|---------------------|--------------------|---------------|--------------------------------------|
| `id_reserva`        | SERIAL             | PK            | Identificador único                  |
| `usuario_id`        | INTEGER            | FK → `usuarios.id_usuario` | Cliente que reserva     |
| `sucursal_id`       | INTEGER            | FK → `sucursales.id_sucursal` | Sucursal destino |
| `fecha_reserva`     | DATE               | NOT NULL      | Fecha en que el cliente acudirá      |
| `hora_atencion`     | TIME               | NOT NULL      | Horario aproximado de atención       |
| `estado`            | ENUM               | NOT NULL, DEFAULT `pendiente` | `pendiente`, `preparada`, `completada`, `cancelada` |
| `fecha_creacion`    | TIMESTAMP          | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Fecha de creación |

> **Flujo de estados:**
> 1. `pendiente` → El cliente crea la reserva; la sucursal es notificada (RF11).
> 2. `preparada` → El encargado prepara las prendas; se confirma recepción del cliente.
> 3. `completada` → El cliente se prueba las prendas y decide la compra.
> 4. `cancelada` → El cliente cancela la reserva (libera el stock reservado).

---

### 2.15 ITEM DE RESERVA (`reserva_items`)

Prendas detalladas de cada reserva (detalle de la reserva).

| Campo            | Tipo          | Restricciones | Descripción                          |
|------------------|---------------|---------------|--------------------------------------|
| `id_reserva_item`| SERIAL        | PK            | Identificador único                  |
| `reserva_id`     | INTEGER       | FK → `reservas.id_reserva` | Reserva a la que pertenece |
| `variante_id`    | INTEGER       | FK → `producto_variantes.id_variante` | Prenda reservada |
| `cantidad`       | INTEGER       | NOT NULL, CHECK (≥ 1) | Cantidad de unidades reservadas |

---

### 2.16 PEDIDO (Compra) (`pedidos`)

Registro de las compras realizadas por un cliente, ya sea de forma digital (web/móvil) o presencial (punto de caja).

| Campo           | Tipo           | Restricciones | Descripción                          |
|-----------------|----------------|---------------|--------------------------------------|
| `id_pedido`     | SERIAL         | PK            | Identificador único                  |
| `usuario_id`    | INTEGER        | FK → `usuarios.id_usuario` | Cliente comprador        |
| `sucursal_id`   | INTEGER        | FK → `sucursales.id_sucursal` (NULL) | Sucursal (para venta presencial) |
| `fecha_pedido`  | TIMESTAMP      | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Fecha de la compra |
| `total`         | NUMERIC(10,2)  | NOT NULL      | Monto total del pedido               |
| `metodo_compra` | ENUM           | NOT NULL      | `digital` (web/móvil) o `presencial` (caja) |
| `estado`        | ENUM           | NOT NULL, DEFAULT `pendiente` | `pendiente`, `pagado`, `enviado`, `entregado`, `cancelado` |
| `tipo_pago`     | ENUM           | NULL (NULL si pendiente) | `tarjeta_debito`, `tarjeta_credito`, `qr`, `transferencia`, `efectivo` |

---

### 2.17 ITEM DE PEDIDO (`pedido_items`)

Detalle de los productos de cada pedido.

| Campo          | Tipo          | Restricciones | Descripción                        |
|----------------|---------------|---------------|------------------------------------|
| `id_pedido_item`| SERIAL       | PK            | Identificador único                |
| `pedido_id`    | INTEGER       | FK → `pedidos.id_pedido` | Pedido al que pertenece  |
| `variante_id`  | INTEGER       | FK → `producto_variantes.id_variante` | Prenda comprada |
| `cantidad`     | INTEGER       | NOT NULL, CHECK (≥ 1) | Cantidad comprada      |
| `precio_unitario`| NUMERIC(10,2)| NOT NULL      | Precio aplicado en el momento      |
| `subtotal`     | NUMERIC(10,2) | NOT NULL      | `precio_unitario × cantidad`       |

---

### 2.18 PAGO (`pagos`)

Registro de las transacciones de pago, principalmente las realizadas vía pasarela de pago (digital).

| Campo            | Tipo          | Restricciones | Descripción                          |
|------------------|---------------|---------------|--------------------------------------|
| `id_pago`        | SERIAL        | PK            | Identificador único                  |
| `pedido_id`      | INTEGER       | FK → `pedidos.id_pedido` | Pedido asociado           |
| `monto`          | NUMERIC(10,2) | NOT NULL      | Monto cobrado                       |
| `proveedor_pago` | VARCHAR(50)   | NOT NULL      | Pasarela usada (STRIPE, PAYPAL, LIBÉLULA) |
| `transaccion_id` | VARCHAR(100)  | NULL          | ID de la transacción retornada por la pasarela |
| `estado`         | ENUM          | NOT NULL      | `pendiente`, `aprobado`, `rechazado`, `reembolsado` |
| `fecha_pago`     | TIMESTAMP     | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Fecha del pago |

> **Regla de negocio:** para el proyecto académico se usa el **entorno de prueba (sandbox)** de la pasarela (RNF09). El estado del pago lo confirma el sistema de pagos (actor externo).

---

## 3. Tabla de Relaciones y Cardinalidades

| # | Tabla Origen | Relación | Tabla Destino        | Cardinalidad | Descripción                                                      |
|---|--------------|----------|----------------------|--------------|------------------------------------------------------------------|
| 1 | `ciudades`   | 1 ────── N | `sucursales`        | 1:N          | Una ciudad puede tener muchas sucursales; una sucursal pertenece a una sola ciudad. |
| 2 | `sucursales` | 1 ────── N | `usuarios`          | 1:N          | Una sucursal tiene varios empleados; un empleado pertenece a una sola sucursal. |
| 3 | `categorias` | 1 ────── N | `productos`         | 1:N          | Una categoría agrupa muchos productos; un producto tiene una sola categoría. |
| 4 | `temporadas` | 1 ────── N | `productos`         | 1:N          | Una temporada cubre muchos productos; un producto corresponde a una temporada. |
| 5 | `temporadas` | 1 ────── N | `colecciones`       | 1:N          | Una temporada puede tener varias colecciones; una colección pertenece a una temporada. |
| 6 | `colecciones`| 1 ────── N | `productos`         | 1:N          | Una colección agrupa varios productos; un producto puede pertenecer a una colección. |
| 7 | `proveedores`| 1 ────── N | `productos`         | 1:N          | Un proveedor suministra varios productos; un producto es de un solo proveedor. |
| 8 | `productos`  | 1 ────── N | `producto_variantes`| 1:N          | Un producto tiene varias variantes (talla y color); una variante pertenece a un solo producto. |
| 9 | `colores`    | 1 ────── N | `producto_variantes`| 1:N          | Un color se usa en varias variantes; una variante tiene un solo color. |
|10 | `tallas`     | 1 ────── N | `producto_variantes`| 1:N          | Una talla se usa en varias variantes; una variante tiene una sola talla. |
|11 | `producto_variantes` | N ──── N | `sucursales`  | N:N          | **Se resuelve con la tabla `inventario`.** Una variante existe en varias sucursales y una sucursal tiene varias variantes. |
|12 | `producto_variantes` | 1 ──── N | `inventario`  | 1:N          | Una variante tiene registros de inventario en cada sucursal. |
|13 | `sucursales` | 1 ──── N | `inventario`      | 1:N          | Una sucursal tiene varios registros de inventario. |
|14 | `producto_variantes` | 1 ──── N | `movimientos_inventario` | 1:N | Una variante posee varios movimientos de inventario. |
|15 | `sucursales` | 1 ──── N | `movimientos_inventario` | 1:N | Una sucursal registra varios movimientos de inventario. |
|16 | `usuarios`   | 1 ──── N | `reservas`         | 1:N          | Un cliente puede crear muchas reservas; una reserva es de un solo cliente. |
|17 | `sucursales` | 1 ──── N | `reservas`         | 1:N          | Una sucursal recibe varias reservas; una reserva se dirige a una sola sucursal. |
|18 | `reservas`   | 1 ──── N | `reserva_items`    | 1:N          | Una reserva contiene varios ítems; un ítem pertenece a una sola reserva. |
|19 | `producto_variantes` | 1 ──── N | `reserva_items` | 1:N | Una variante puede estar en varias reservas; un ítem de reserva es una variante. |
|20 | `usuarios`   | 1 ──── N | `pedidos`          | 1:N          | Un cliente realiza varios pedidos; un pedido es de un solo cliente. |
|21 | `sucursales` | 1 ──── N | `pedidos`          | 1:N          | Una sucursal registra varias ventas; un pedido (presencial) es de una sucursal. |
|22 | `pedidos`    | 1 ──── N | `pedido_items`     | 1:N          | Un pedido contiene varios ítems; un ítem pertenece a un solo pedido. |
|23 | `producto_variantes` | 1 ──── N | `pedido_items`  | 1:N          | Una variante aparece en varios ítems de pedido; un ítem es una variante. |
|24 | `pedidos`    | 1 ──── 1 | `pagos`            | 1:1          | Un pedido tiene uno o varios pagos (equivalente); un pago corresponde a un pedido. |

---

## 4. Restricciones de Integridad Clave

- **Claves primarias (PK):** cada tabla tiene `id` autogenerado (SERIAL).
- **Claves foráneas (FK):** todas las relaciones referenciales son FK con integridad referencial (no se puede borrar un padre con dependientes salvo regla definida).
- **Unicidad:**
  - `usuarios.email` único.
  - `ciudades.nombre`, `categorias.nombre`, `colores.nombre`, `tallas.nombre`, `temporadas.nombre`, `colecciones.nombre`, `proveedores.nombre` únicos.
  - `producto_variantes.sku` único.
  - `inventario (variante_id, sucursal_id)` único.
- **Comprobaciones (CHECK):** `cantidad_disponible ≥ 0`, `cantidad_reservada ≥ 0`, `cantidad_recibida ≥ 0`, `cantidad ≥ 1` en items.
- **Obligatoriedad (NOT NULL):** todos los atributos esenciales son obligatorios; solo los opcionales (descripciones, teléfonos, URLs, sucursal de cliente) admiten `NULL`.

---

## 5. Reglas de Negocio sobre el Inventario (RF20, RF21, RF22)

El sistema debe actualizar automáticamente el inventario según el evento:

| Evento                          | Tabla afectada                     | Efecto                                                         |
|---------------------------------|------------------------------------|---------------------------------------------------------------|
| **Reserva creada**              | `inventario.cantidad_reservada`    | Aumenta la cantidad reservada.                                 |
| **Reserva cancelada**           | `inventario.cantidad_reservada`    | Disminuye la cantidad reservada (se libera).                   |
| **Venta digital o presencial**  | `inventario.cantidad_disponible`   | Disminuye la cantidad disponible.                              |
| **Recepción de producto (proveedor)** | `inventario.cantidad_recibida`  | Aumenta la cantidad a ingresar.                                |
| **Confirmación de recepción**   | `inventario.cantidad_disponible`, `cantidad_recibida` | Aumenta disponible, disminuye recibida. |
| **Devolución**                  | `inventario.cantidad_disponible`   | Aumenta la cantidad disponible.                                |

Cada uno de estos eventos genera además un registro en `movimientos_inventario` como historial.

---

## 6. Estados derivados de inventario (RF08, RF21)

| Estado              | Condición                                            |
|---------------------|------------------------------------------------------|
| **Disponible**      | `cantidad_disponible > 0`                            |
| **Reservada**       | `cantidad_reservada > 0`                             |
| **Vendida**         | Se registra en `movimientos_inventario` tipo `venta` |
| **Agotada**         | `cantidad_disponible = 0`                            |
| **Próxima a ingresar** | `cantidad_recibida > 0`                           |

---

*Documento generado para el análisis de la base de datos del proyecto FashionStore.*