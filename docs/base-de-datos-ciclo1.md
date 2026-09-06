# Base de Datos por Módulos - FashionStore

**Sistemas II** - Plataforma Inteligente de Comercio Electrónico para Tienda de Ropa con Vestidores Virtuales Vía Realidad Aumentada.

**Base de datos:** PostgreSQL (Sistema Gestor de Base de Datos Relacional)
**Base:** Los módulos y tablas están organizados en función de los **casos de uso priorizados en el CICLO #1** (CU1–CU6, CU8, CU9, CU18, CU19, CU20, CU21).

---

## Tabla de Contenidos

- [Módulo 1: Autenticación y Usuarios](#módulo-1-autenticación-y-usuarios)
- [Módulo 2: Ubicación (Ciudades y Sucursales)](#módulo-2-ubicación-ciudades-y-sucursales)
- [Módulo 3: Catálogo de Productos](#módulo-3-catálogo-de-productos)
- [Módulo 4: Inventario y Existencias](#módulo-4-inventario-y-existencias)
- [Módulo 5: Reservas](#módulo-5-reservas)
- [Resumen de Tablas](#resumen-de-tablas)
- [Matriz de Relaciones y Cardinalidades](#matriz-de-relaciones-y-cardinalidades)

---

## Módulo 1: Autenticación y Usuarios

**Casos de uso cubiertos:** CU1 (Registrarse), CU2 (Iniciar sesión), CU3 (Gestionar perfil), CU19 (Administrar usuarios y roles).

### Tabla: USUARIOS (`usuarios`)

Almacena la información de todos los usuarios del sistema: clientes, empleados (encargados de sucursal, cajeros) y administradores.

| Campo            | Tipo            | Restricciones                  | Descripción                                             |
|------------------|-----------------|--------------------------------|---------------------------------------------------------|
| `id_usuario`     | SERIAL          | PK                             | Identificador único del usuario                         |
| `nombre`         | VARCHAR(100)    | NOT NULL                       | Nombre completo del usuario                             |
| `email`          | VARCHAR(150)    | NOT NULL, UNIQUE               | Correo electrónico (usado para login)                   |
| `telefono`       | VARCHAR(20)     | NULL                           | Teléfono de contacto                                    |
| `contrasena`     | VARCHAR(255)    | NOT NULL                       | Hash de la contraseña (segura, RNF01)                   |
| `rol`            | ENUM            | NOT NULL                       | `admin`, `encargado`, `cajero`, `cliente`               |
| `sucursal_id`    | INTEGER         | FK → `sucursales.id_sucursal` (NULL) | Sucursal a la que pertenece (solo empleados)       |
| `fecha_registro` | TIMESTAMP       | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Fecha de alta del usuario                         |
| `activo`         | BOOLEAN         | NOT NULL, DEFAULT `TRUE`       | Indica si la cuenta está activa                         |

**Relaciones:**
- **N:1** con `sucursales` (un empleado pertenece a una sucursal) → relación **9**.

---

## Módulo 2: Ubicación (Ciudades y Sucursales)

**Casos de uso cubiertos:** CU20 (Administrar sucursales), CU6 (Consultar disponibilidad por sucursal).

### Tabla: CIUDADES (`ciudades`)

Representa las ciudades donde la cadena tiene presencia.

| Campo       | Tipo         | Restricciones      | Descripción                     |
|-------------|--------------|--------------------|---------------------------------|
| `id_ciudad` | SERIAL       | PK                 | Identificador único de la ciudad|
| `nombre`    | VARCHAR(100) | NOT NULL, UNIQUE   | Nombre de la ciudad             |

**Relaciones:**
- **1:N** con `sucursales` (una ciudad tiene varias sucursales) → relación **1**.

### Tabla: SUCURSALES (`sucursales`)

Representa cada tienda física de la cadena, ubicada en una ciudad.

| Campo               | Tipo         | Restricciones                     | Descripción                         |
|---------------------|--------------|-----------------------------------|-------------------------------------|
| `id_sucursal`       | SERIAL       | PK                                | Identificador único de la tienda    |
| `ciudad_id`         | INTEGER      | FK → `ciudades.id_ciudad`         | Ciudad donde se ubica la sucursal   |
| `nombre`            | VARCHAR(150) | NOT NULL                          | Nombre de la sucursal               |
| `direccion`         | VARCHAR(255) | NOT NULL                          | Dirección física                    |
| `telefono`          | VARCHAR(20)  | NULL                              | Teléfono de la sucursal             |
| `horario_apertura`  | TIME         | NOT NULL                          | Hora de apertura                    |
| `horario_cierre`    | TIME         | NOT NULL                          | Hora de cierre                      |
| `activo`            | BOOLEAN      | NOT NULL, DEFAULT `TRUE`          | Indica si la sucursal está operativa|

**Relaciones:**
- **N:1** con `ciudades` (pertenece a una ciudad) → relación **1**.
- **1:N** con `usuarios` (una sucursal tiene varios empleados) → relación **9**.
- **1:N** con `inventario` (una sucursal tiene varios registros de inventario) → relación **12**.
- **1:N** con `reservas` (una sucursal recibe varias reservas) → relación **15**.

---

## Módulo 3: Catálogo de Productos

**Casos de uso cubiertos:** CU4 (Consultar catálogo), CU5 (Filtrar por talla, color, categoría, temporada), CU21 (Administrar catálogo de productos CRUD).

Este módulo contiene las tablas de dominio del catálogo. La **tabla puente** `producto_variantes` resuelve la relación **N:N** entre `productos` y (`tallas` × `colores`).

### Tabla: CATEGORÍAS (`categorias`)

| Campo          | Tipo         | Restricciones        | Descripción                                  |
|----------------|--------------|----------------------|----------------------------------------------|
| `id_categoria` | SERIAL       | PK                   | Identificador único                          |
| `nombre`       | VARCHAR(100) | NOT NULL, UNIQUE     | Nombre (Ej: Camiseta, Pantalón, Vestido)     |
| `descripcion`  | TEXT         | NULL                 | Descripción opcional                         |

**Relaciones:**
- **1:N** con `productos` (una categoría agrupa varios productos) → relación **3**.

### Tabla: COLORES (`colores`)

| Campo        | Tipo         | Restricciones   | Descripción                              |
|--------------|--------------|-----------------|------------------------------------------|
| `id_color`   | SERIAL       | PK              | Identificador único                      |
| `nombre`     | VARCHAR(50)  | NOT NULL, UNIQUE| Nombre del color                         |
| `codigo_hex` | VARCHAR(7)   | NOT NULL        | Código hexadecimal (Ej: `#FF0000`)       |

**Relaciones:**
- **1:N** con `producto_variantes` (un color se usa en varias variantes) → relación **7**.

### Tabla: TALLAS (`tallas`)

| Campo      | Tipo        | Restricciones   | Descripción                          |
|------------|-------------|-----------------|--------------------------------------|
| `id_talla` | SERIAL      | PK              | Identificador único                  |
| `nombre`   | VARCHAR(10) | NOT NULL, UNIQUE | Etiqueta de la talla (Ej: S, M, L, XL) |

**Relaciones:**
- **1:N** con `producto_variantes` (una talla se usa en varias variantes) → relación **8**.

### Tabla: TEMPORADAS (`temporadas`)

Temporadas comerciales de la ropa.

| Campo          | Tipo        | Restricciones  | Descripción                                 |
|----------------|-------------|----------------|---------------------------------------------|
| `id_temporada` | SERIAL      | PK             | Identificador único                         |
| `nombre`       | VARCHAR(100)| NOT NULL, UNIQUE| Nombre (Ej: Primavera-Verano, Otoño-Invierno) |
| `fecha_inicio` | DATE        | NOT NULL       | Fecha de inicio                             |
| `fecha_fin`    | DATE        | NOT NULL       | Fecha de fin                                |

**Relaciones:**
- **1:N** con `productos` (una temporada cubre varios productos) → relación **4**.

### Tabla: COLECCIONES (`colecciones`)

Colecciones pertenecientes a una temporada.

| Campo            | Tipo        | Restricciones                       | Descripción                 |
|------------------|-------------|-------------------------------------|-----------------------------|
| `id_coleccion`   | SERIAL      | PK                                  | Identificador único         |
| `temporada_id`   | INTEGER     | FK → `temporadas.id_temporada`      | Temporada a la que pertenece|
| `nombre`         | VARCHAR(150)| NOT NULL, UNIQUE                    | Nombre de la colección      |
| `descripcion`    | TEXT        | NULL                                | Descripción                 |
| `es_promocional` | BOOLEAN     | NOT NULL, DEFAULT `FALSE`           | Es temporada promocional    |

**Relaciones:**
- **N:1** con `temporadas` (pertenece a una temporada) → relación **5**.
- **1:N** con `productos` (agrupa varios productos) → relación **6**.

### Tabla: PROVEEDORES (`proveedores`)

| Campo          | Tipo         | Restricciones    | Descripción                        |
|----------------|--------------|------------------|------------------------------------|
| `id_proveedor` | SERIAL       | PK               | Identificador único                |
| `nombre`       | VARCHAR(150) | NOT NULL, UNIQUE | Razón social del proveedor         |
| `contacto`     | VARCHAR(100) | NULL             | Persona de contacto                |
| `telefono`     | VARCHAR(20)  | NULL             | Teléfono                           |
| `email`        | VARCHAR(150) | NULL             | Correo electrónico                 |
| `direccion`    | VARCHAR(255) | NULL             | Dirección del proveedor            |

**Relaciones:**
- **1:N** con `productos` (un proveedor suministra varios productos) → relación **2**.

### Tabla: PRODUCTOS (`productos`)

Prendas de vestir. Cada producto se comercializa en varias variantes (talla × color).

| Campo            | Tipo            | Restricciones                              | Descripción                        |
|------------------|-----------------|--------------------------------------------|------------------------------------|
| `id_producto`    | SERIAL          | PK                                         | Identificador único                |
| `nombre`         | VARCHAR(150)    | NOT NULL                                   | Nombre de la prenda                |
| `descripcion`    | TEXT            | NULL                                       | Descripción detallada              |
| `precio`         | NUMERIC(10,2)   | NOT NULL                                   | Precio unitario                    |
| `categoria_id`   | INTEGER         | FK → `categorias.id_categoria`             | Categoría de la prenda             |
| `temporada_id`   | INTEGER         | FK → `temporadas.id_temporada`             | Temporada a la que corresponde     |
| `coleccion_id`   | INTEGER         | FK → `colecciones.id_coleccion` (NULL)     | Colección a la que pertenece       |
| `proveedor_id`   | INTEGER         | FK → `proveedores.id_proveedor`            | Proveedor que la suministra        |
| `imagen_url`     | VARCHAR(255)    | NULL                                       | URL de la imagen principal         |
| `modelo_3d_url`  | VARCHAR(255)    | NULL                                       | URL del modelo 3D/AR (vestidor virtual) |
| `activo`         | BOOLEAN         | NOT NULL, DEFAULT `TRUE`                   | Disponible para la venta           |

**Relaciones:**
- **N:1** con `categorias` → **3**.
- **N:1** con `temporadas` → **4**.
- **N:1** con `colecciones` → **6**.
- **N:1** con `proveedores` → **2**.
- **1:N** con `producto_variantes` → **7**.

### Tabla: PRODUCTO_VARIANTES (`producto_variantes`)

**Tabla puente / asociativa** que resuelve la relación **N:N** entre productos y sus variantes (talla × color). Es la unidad rastreada en inventario.

| Campo          | Tipo          | Restricciones                              | Descripción                          |
|----------------|---------------|--------------------------------------------|--------------------------------------|
| `id_variante`  | SERIAL        | PK                                         | Identificador único                  |
| `producto_id`  | INTEGER       | FK → `productos.id_producto`               | Producto base                        |
| `color_id`     | INTEGER       | FK → `colores.id_color`                    | Color de la variante                 |
| `talla_id`     | INTEGER       | FK → `tallas.id_talla`                     | Talla de la variante                 |
| `sku`          | VARCHAR(50)   | NOT NULL, UNIQUE                           | Código interno de la variante        |
| `precio_extra` | NUMERIC(10,2) | NOT NULL, DEFAULT `0`                      | Sobreprecio de la variante           |

> **Unicidad compuesta:** (`producto_id`, `color_id`, `talla_id`) único.

**Relaciones:**
- **N:1** con `productos` → **7**.
- **N:1** con `colores` → **8**.
- **N:1** con `tallas` → **9**.
- **1:N** con `inventario` → **10**.
- **1:N** con `movimientos_inventario` → **13**.
- **1:N** con `reserva_items` → **15**.

---

## Módulo 4: Inventario y Existencias

**Casos de uso cubiertos:** CU6 (Consultar disponibilidad por sucursal).

Este módulo resuelve la relación **N:N** entre `producto_variantes` y `sucursales`. Controla existencias y registra el histórico de movimientos.

### Tabla: INVENTARIO (`inventario`)

Cantidad de unidades de cada variante por sucursal. **Tabla central de control de existencias.**

| Campo                  | Tipo       | Restricciones                          | Descripción                                   |
|------------------------|------------|----------------------------------------|-----------------------------------------------|
| `id_inventario`        | SERIAL     | PK                                     | Identificador único                           |
| `variante_id`          | INTEGER    | FK → `producto_variantes.id_variante`  | Variante                                      |
| `sucursal_id`          | INTEGER    | FK → `sucursales.id_sucursal`          | Sucursal                                      |
| `cantidad_disponible`  | INTEGER    | NOT NULL, CHECK (≥ 0)                  | Unidades a la venta (no reservadas)           |
| `cantidad_reservada`   | INTEGER    | NOT NULL, DEFAULT `0`, CHECK (≥ 0)     | Unidades apartadas por reservas               |
| `cantidad_recibida`    | INTEGER    | NOT NULL, DEFAULT `0`                  | Unidades por procesar (próximas a ingresar)   |
| `stock_minimo`         | INTEGER    | NOT NULL, DEFAULT `0`                  | Nivel mínimo de reposición (alerta)           |

> **Unicidad compuesta:** (`variante_id`, `sucursal_id`) único.
>
> **Estados derivados:**
> - **Disponible**: `cantidad_disponible > 0`
> - **Reservada**: `cantidad_reservada > 0`
> - **Agotada**: `cantidad_disponible = 0`
> - **Próxima a ingresar**: `cantidad_recibida > 0`

**Relaciones:**
- **N:1** con `producto_variantes` → **10**.
- **N:1** con `sucursales` → **11**.

### Tabla: MOVIMIENTOS_INVENTARIO (`movimientos_inventario`)

Historial de todas las operaciones que afectan el inventario.

| Campo                | Tipo          | Restricciones                              | Descripción                              |
|----------------------|---------------|--------------------------------------------|------------------------------------------|
| `id_movimiento`      | SERIAL        | PK                                         | Identificador único                      |
| `variante_id`        | INTEGER       | FK → `producto_variantes.id_variante`      | Variante afectada                        |
| `sucursal_id`        | INTEGER       | FK → `sucursales.id_sucursal`              | Sucursal                                 |
| `tipo_movimiento`    | ENUM          | NOT NULL                                   | `entrada`, `salida`, `reserva`, `cancelacion_reserva`, `venta`, `devolucion`, `ajuste` |
| `cantidad`           | INTEGER       | NOT NULL                                   | Cantidad (positiva o negativa)           |
| `referencia_id`      | INTEGER       | NULL                                       | ID de la transacción que lo originó      |
| `observacion`        | TEXT          | NULL                                       | Nota adicional                           |
| `fecha_movimiento`   | TIMESTAMP     | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`      | Fecha del movimiento                     |

**Relaciones:**
- **N:1** con `producto_variantes` → **13**.
- **N:1** con `sucursales` → **14**.

---

## Módulo 5: Reservas

**Casos de uso cubiertos:** CU8 (Realizar reserva de múltiples prendas), CU9 (Consultar y cancelar reservas), CU18 (Preparar reservas - encargado).

### Tabla: RESERVAS (`reservas`)

Reserva de varias prendas que un cliente hace para probarlas en un vestidor físico de una sucursal.

| Campo            | Tipo              | Restricciones                          | Descripción                        |
|------------------|-------------------|----------------------------------------|------------------------------------|
| `id_reserva`     | SERIAL            | PK                                     | Identificador único                |
| `usuario_id`     | INTEGER           | FK → `usuarios.id_usuario`             | Cliente que reserva                |
| `sucursal_id`    | INTEGER           | FK → `sucursales.id_sucursal`          | Sucursal destino                   |
| `fecha_reserva`  | DATE              | NOT NULL                               | Fecha en que el cliente acudirá    |
| `hora_atencion`  | TIME              | NOT NULL                               | Horario aproximado de atención     |
| `estado`         | ENUM              | NOT NULL, DEFAULT `pendiente`          | `pendiente`, `preparada`, `completada`, `cancelada` |
| `fecha_creacion` | TIMESTAMP         | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`  | Fecha de creación                  |

> **Flujo de estados:**
> 1. `pendiente` → el cliente crea la reserva; la sucursal es notificada.
> 2. `preparada` → el encargado prepara las prendas.
> 3. `completada` → el cliente se prueba y decide la compra.
> 4. `cancelada` → el cliente cancela (libera el stock reservado).

**Relaciones:**
- **N:1** con `usuarios` → **14**.
- **N:1** con `sucursales` → **15**.
- **1:N** con `reserva_items` → **16**.

### Tabla: RESERVA_ITEMS (`reserva_items`)

Prendas detalladas de cada reserva (detalle de la reserva).

| Campo             | Tipo      | Restricciones                          | Descripción                      |
|-------------------|-----------|----------------------------------------|----------------------------------|
| `id_reserva_item` | SERIAL    | PK                                     | Identificador único              |
| `reserva_id`      | INTEGER   | FK → `reservas.id_reserva`             | Reserva a la que pertenece       |
| `variante_id`     | INTEGER   | FK → `producto_variantes.id_variante`  | Prenda reservada                 |
| `cantidad`        | INTEGER   | NOT NULL, CHECK (≥ 1)                  | Cantidad de unidades reservadas  |

**Relaciones:**
- **N:1** con `reservas` → **16**.
- **N:1** con `producto_variantes` → **17**.

---

## Resumen de Tablas

| Módulo           | Tablas incluidas                                                                 |
|------------------|----------------------------------------------------------------------------------|
| **1. Autenticación y Usuarios** | `usuarios`                                                            |
| **2. Ubicación**             | `ciudades`, `sucursales`                                                       |
| **3. Catálogo**              | `categorias`, `colores`, `tallas`, `temporadas`, `colecciones`, `proveedores`, `productos`, `producto_variantes` |
| **4. Inventario**            | `inventario`, `movimientos_inventario`                                         |
| **5. Reservas**              | `reservas`, `reserva_items`                                                    |

> **Tablas faltantes para ciclos posteriores (no incluidas en el CICLO #1):** `pedidos`, `pedido_items`, `pagos` (módulo de ventas/pagos). Se agregarán en el Ciclo #2.

---

## Matriz de Relaciones y Cardinalidades

| # | Tabla Origen          | Relación | Tabla Destino            | Cardinalidad | Descripción                                                      |
|---|-----------------------|----------|--------------------------|--------------|------------------------------------------------------------------|
| 1 | `ciudades`            | 1 ────── N | `sucursales`           | 1:N          | Una ciudad tiene varias sucursales.                               |
| 2 | `proveedores`         | 1 ────── N | `productos`            | 1:N          | Un proveedor suministra varios productos.                         |
| 3 | `categorias`          | 1 ────── N | `productos`            | 1:N          | Una categoría agrupa varios productos.                            |
| 4 | `temporadas`          | 1 ────── N | `productos`            | 1:N          | Una temporada cubre varios productos.                             |
| 5 | `temporadas`          | 1 ────── N | `colecciones`          | 1:N          | Una temporada contiene varias colecciones.                        |
| 6 | `colecciones`         | 1 ────── N | `productos`            | 1:N          | Una colección agrupa varios productos.                            |
| 7 | `productos`           | 1 ────── N | `producto_variantes`   | 1:N          | Un producto tiene varias variantes (talla × color).              |
| 8 | `colores`             | 1 ────── N | `producto_variantes`   | 1:N          | Un color se usa en varias variantes.                              |
| 9 | `tallas`              | 1 ────── N | `producto_variantes`   | 1:N          | Una talla se usa en varias variantes.                             |
| 10| `producto_variantes`  | 1 ────── N | `inventario`           | 1:N          | Una variante tiene inventario en cada sucursal.                   |
| 11| `sucursales`          | 1 ────── N | `inventario`           | 1:N          | Una sucursal tiene varios registros de inventario.                |
| 12| `producto_variantes`  | N ────── N | `sucursales`           | N:N          | **Tabla intermedia `inventario`** (relaciones 10 y 11).           |
| 13| `producto_variantes`  | 1 ────── N | `movimientos_inventario` | 1:N        | Una variante posee varios movimientos de inventario.              |
| 14| `sucursales`          | 1 ────── N | `movimientos_inventario` | 1:N        | Una sucursal registra varios movimientos.                         |
| 15| `usuarios`            | 1 ────── N | `reservas`             | 1:N          | Un cliente crea varias reservas.                                  |
| 16| `sucursales`          | 1 ────── N | `reservas`             | 1:N          | Una sucursal recibe varias reservas.                              |
| 17| `reservas`            | 1 ────── N | `reserva_items`        | 1:N          | Una reserva contiene varios ítems.                                |
| 18| `producto_variantes`  | 1 ────── N | `reserva_items`        | 1:N          | Una variante puede estar en varios ítems de reserva.              |
| 19| `sucursales`          | 1 ────── N | `usuarios`             | 1:N          | Una sucursal tiene varios empleados.                              |

---

*Documento generado para el análisis de la base de datos del proyecto FashionStore, organizado por módulos según los casos de uso del CICLO #1.*