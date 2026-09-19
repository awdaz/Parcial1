# UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO
**FACULTAD DE INGENIERÍA EN CIENCIAS DE LA COMPUTACIÓN Y TELECOMUNICACIONES**

## PLATAFORMA INTELIGENTE DE COMERCIO ELECTRÓNICO PARA TIENDA DE ROPA CON VESTIDORES VIRTUALES VÍA REALIDAD AUMENTADA
**Grupo # 35**
**MATERIA:** Sistemas de Información II
**SIGLA:** INF 412 - SA
**DOCENTE:** MSc. Ing. Angélica Garzón Cuéllar

**INTEGRANTES | REGISTRO**
* Montaño Roca Rafael | 220154511
* Valencia Amezaga Andre | 224072145

**Semestre II/2026**
**Santa Cruz de la Sierra – Bolivia**

---

## 1) PERFIL

### 1.1 INTRODUCCIÓN
En la actualidad, el sector retail textil enfrenta el desafío de converger la experiencia física con la digital. Los clientes demandan comodidad para explorar catálogos desde casa, pero también la certeza de que las prendas les quedarán bien, reduciendo así las altas tasas de devolución por tallas incorrectas.
El presente proyecto, denominado FashionStore, propone el desarrollo de una plataforma inteligente de comercio electrónico que integra, bajo un ecosistema omnicanal, una tienda en línea (web y móvil), la gestión centralizada de inventarios por sucursal, y una innovadora funcionalidad de vestidores virtuales mediante Realidad Aumentada (AR). Además, se incorporarán asistentes de recomendación basados en Inteligencia Artificial (IA) para mejorar la experiencia de compra. El desarrollo se enmarca bajo la metodología del Proceso Unificado de Desarrollo de Software (PUDS) y el modelado con UML 2.5+, garantizando un producto robusto, escalable y alineado con las necesidades del negocio.

### 1.2 OBJETIVO GENERAL
Desarrollar una plataforma inteligente de comercio electrónico para una cadena de tiendas de ropa, que integre comercio electrónico web y móvil, reservas de prendas, gestión de sucursales, inventario, puntos de venta, pagos electrónicos, vestidores virtuales mediante realidad aumentada e inteligencia artificial, utilizando el Proceso Unificado de Desarrollo y modelos UML.

### 1.3 OBJETIVOS ESPECÍFICOS
* Recolectar documentar los requisitos funcionales y no funcionales del sistema, así como las necesidades de los actores (clientes, administradores, encargados, cajeros), mediante entrevistas, observación y análisis del negocio, para establecer una base sólida que guíe el desarrollo.
* Analizar los requisitos en modelos UML (casos de uso, clases, secuencias, comunicación y estados), definiendo la arquitectura lógica del sistema, los flujos de trabajo, la interacción entre módulos y los mecanismos de seguridad y auditoría, asegurando la trazabilidad y consistencia de los datos.
* Diseñar la arquitectura física (despliegue, componentes, base de datos), la interfaz de usuario (web y móvil) y la integración con servicios externos (pasarela de pago, realidad aumentada, motor de recomendaciones), definiendo el esquema de datos, la estructura de paquetes y los prototipos de navegación.
* Implementar la plataforma siguiendo el diseño definido, codificando el backend con FastAPI (Python), el frontend web con Angular (TypeScript) y la aplicación móvil con Flutter (Dart), integrando todos los módulos (usuarios, catálogo, inventario, reservas, ventas, pagos, inteligencia y reportes) y desplegando en un entorno de producción (Neon.Tech / Docker).
* Probar la funcionalidad, rendimiento, seguridad y usabilidad del sistema mediante pruebas unitarias, de integración, de carga y de aceptación, asegurando que cumple con los requisitos establecidos y que la experiencia de usuario es óptima en todos los dispositivos y escenarios de uso.

### 1.4 DESCRIPCIÓN DEL PROBLEMA
La cadena de tiendas de ropa carece actualmente de una plataforma unificada que sincronice sus operaciones físicas y digitales. Los clientes no pueden visualizar la disponibilidad en tiempo real de las prendas por sucursal, lo que genera frustración al acudir a una tienda y encontrar productos agotados. Además, el proceso de reserva para probarse prendas es manual y no está integrado con el inventario, provocando sobreventas o pérdida de oportunidades. La falta de herramientas de IA impide ofrecer recomendaciones personalizadas, y la ausencia de vestidores virtuales limita la experiencia de compra digital. Por otro lado, la administración de inventarios, proveedores y temporadas se realiza de forma descentralizada, dificultando la toma de decisiones. El presente proyecto soluciona estas brechas mediante una plataforma con inteligencia de negocio.

### 1.5 ALCANCE

**1. MÓDULO DE GESTIÓN DE USUARIOS Y SEGURIDAD**
El módulo de gestión de usuarios y seguridad constituye la base de la plataforma, encargándose de todos los aspectos relacionados con la identidad, autenticación y control de acceso de los usuarios del sistema. Este paquete gestiona el registro de nuevos clientes (CU-01), el inicio de sesión (CU-02) y el cierre de sesión (CU-22)...

**2. MÓDULO DE CATÁLOGO**
El módulo de Catalogo es el núcleo de la oferta comercial de FashionStore, gestionando todo el ciclo de vida de los productos y sus atributos asociados...

**3. MÓDULO DE INVENTARIO Y DISPONIBILIDAD**
El módulo de Inventario es el corazón operativo de la cadena de tiendas, responsable de gestionar las existencias físicas de cada prenda en cada sucursal y de proporcionar información en tiempo real sobre la disponibilidad de productos...

**4. MÓDULO DE RESERVAS**
El módulo de Reserva gestiona el proceso de apartado de prendas para su posterior prueba en las tiendas físicas, siendo uno de los diferenciadores clave de la experiencia omnicanal de FashionStore...

**5. MÓDULO DE VENTAS Y PAGOS**
El módulo de Sales & Payments constituye el corazón transaccional del negocio, gestionando todo el proceso de compra, ya sea de forma digital (web o móvil) o presencial (en punto de caja)...

**6. MÓDULO DE INTELIGENCIA Y REPORTES (Intelligence & Reporting)**
El módulo de Intelligence & Reporting agrupa las funcionalidades de valor agregado y de soporte a la toma de decisiones, integrando tecnologías emergentes como la realidad aumentada (RA) y la inteligencia artificial (IA)...

---

## PARTE I – FUNDAMENTACIÓN TEÓRICA

### 1. MARCO REFERENCIAL
#### 1.1 E-COMMERCE: MODELOS Y PLATAFORMAS
El comercio electrónico (e-commerce) es la compra y venta de bienes o servicios a través de internet. Para este proyecto, se ha analizado su funcionamiento desde dos perspectivas:
*   **Como usuario (B2C):** Amazon, Alibaba, Shopify.
*   **Como desarrollador:** Magento, PrestaShop, WooCommerce. *(Nota: El presente proyecto se desarrolla desde cero).*

#### 1.2 PASARELAS DE PAGO
Las pasarelas de pago son servicios que autorizan y procesan transacciones...

#### 1.3 DELIVERY
Si bien el enunciado no exige un módulo de delivery complejo, la fundamentación teórica incluye su comprensión...

#### 1.4 PROCESO UNIFICADO DE DESARROLLO DE SOFTWARE
El PUDS es un marco de trabajo iterativo e incremental basado en UML. Se estructura en cuatro fases: Incepción, Elaboración, Construcción, Transición.

#### 1.5 LENGUAJE UNIFICADO DE MODELADO (UML 2.5+)
UML es un lenguaje estándar para visualizar, especificar y documentar sistemas de software.

### 2. MARCO METODOLÓGICO Y TECNOLÓGICO
#### 2.1 PROCESO UNIFICADO DE DESARROLLO DE SOFTWARE (PUDS)
Se aplicará PUDS de forma iterativa, priorizando los casos de uso de alto valor para el MVP en 3 ciclos de desarrollo.

#### 2.2 LENGUAJE UNIFICADO DE MODELADO (UML)
Se utilizará la herramienta Lucidchart y PlantUML.

#### 2.3 INTELIGENCIA ARTIFICIAL Y PROCESAMIENTO DE DATOS
La IA se integrará mediante un microservicio en Python (FastAPI).

#### 2.4 SISTEMAS BASADOS EN LOCALIZACIÓN
Para la funcionalidad de disponibilidad por sucursal, se georreferenciarán las tiendas.

#### 2.5 ARQUITECTURA CLIENTE-SERVIDOR Y APIS -MONOLÍTICA MODULAR
Se utilizará una arquitectura de microservicios (aunque inicialmente monolítica modular) con FastAPI exponiendo endpoints RESTful.

---

## PARTE II – PROCESO DE DESARROLLO

### 2 FLUJO DE TRABAJO: CAPTURA DE REQUISITOS
#### 2.1 ACTORES
*   **Cliente:** Usuario no autenticado (invitado) o registrado.
*   **Administrador:** Gestiona la configuración global del sistema.
*   **Encargado de Sucursal:** Usuario interno del tenant.
*   **Cajero:** Usuario interno del tenant.
*   **Proveedor:** Entidad externa.
*   **Sistema de Pagos:** Actor externo.
*   **Servicio de IA:** Actor externo o interno.

#### 2.2 CASOS DE USO
| CU | Caso de Uso |
|---|---|
| CU1 | Registrarse en la plataforma |
| CU2 | Iniciar sesión |
| CU3 | Gestionar perfil de usuario |
| CU4 | Consultar catálogo de prendas |
| CU5 | Filtrar productos por talla, color, categoría, temporada |
| CU6 | Consultar disponibilidad por sucursal (tenant) |
| CU7 | Utilizar vestidor virtual (RA) |
| CU8 | Realizar reserva de múltiples prendas |
| CU9 | Consultar y cancelar reservas |
| CU10 | Realizar compra digital |
| CU11 | Realizar compra presencial (caja) |
| CU12 | Gestionar pagos (pasarela) |
| CU13 | Gestionar inventario global y local |
| CU14 | Administrar proveedores |
| CU15 | Administrar temporadas y colecciones |
| CU16 | Generar reportes y dashboards |
| CU17 | Recibir recomendaciones de IA |
| CU18 | Preparar reservas (encargado) |
| CU19 | Administrar usuarios y roles |
| CU20 | Administrar sucursales |
| CU21 | Administrar catálogo de productos (CRUD) |
| CU22 | cerrar sesión |
| CU23 | Registrar bitacora |

#### 2.3 PRIORIZAR CASOS DE USO
*(Tablas de priorización omitidas por brevedad, organizadas en Ciclo 1, Ciclo 2 y Ciclo 3).*

#### 2.4 DETALLAR CASOS DE USO

##### CU-01: Registrarse en la plataforma
| Campo | Descripción |
|---|---|
| **Nombre** | Registrarse en la plataforma |
| **Propósito** | Este caso de uso describe cómo un nuevo cliente crea una cuenta en la plataforma FashionStore. |
| **Actor(es)** | Cliente |
| **Flujo Principal** | 1. El usuario accede a la sección "Registrarse"... 2. El sistema presenta el formulario... |

*(El documento contiene detalles estructurados similares para CU-02 a CU-23).*

---

### 4.2 DISEÑO DE DATOS

#### 4.2.2.2 SCRIPT SQL

```sql
-- SCRIPT 1: CREACIÓN DE LA BASE DE DATOS - FASHIONSTORE
-- Sistemas II - Plataforma Inteligente de Comercio Electrónico
-- Base de datos: PostgreSQL
-- CICLO #1: Autenticación, Ubicación, Catálogo, Inventario, Reservas

-- Eliminar y crear la base de datos (ejecutar fuera de transacción)
DROP DATABASE IF EXISTS fashionstore;
CREATE DATABASE fashionstore;
\c fashionstore;

-- 1. TIPOS ENUM
CREATE TYPE rol_usuario AS ENUM ('admin', 'encargado', 'cajero', 'cliente');
CREATE TYPE tipo_movimiento AS ENUM (
    'entrada', 'salida', 'reserva', 'cancelacion_reserva', 'venta', 'devolucion', 'ajuste'
);
CREATE TYPE estado_reserva AS ENUM (
    'pendiente', 'preparada', 'completada', 'cancelada'
);
CREATE TYPE estado_pedido AS ENUM (
    'pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'
);
CREATE TYPE metodo_compra AS ENUM (
    'digital', 'presencial'
);
CREATE TYPE tipo_pago AS ENUM (
    'tarjeta_debito', 'tarjeta_credito', 'qr', 'transferencia', 'efectivo'
);
CREATE TYPE estado_pago AS ENUM (
    'pendiente', 'aprobado', 'rechazado', 'reembolsado'
);

-- 2. TABLAS
-- MODULO 1: AUTENTICACIÓN Y USUARIOS
CREATE TABLE sucursales (
    id_sucursal       SERIAL PRIMARY KEY,
    ciudad_id         INTEGER        NOT NULL,
    nombre            VARCHAR(150)   NOT NULL,
    direccion         VARCHAR(255)   NOT NULL,
    telefono          VARCHAR(20)    NULL,
    horario_apertura  TIME           NOT NULL,
    horario_cierre    TIME           NOT NULL,
    activo            BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE TABLE usuarios (
    id_usuario      SERIAL PRIMARY KEY,
    nombre          VARCHAR(100)   NOT NULL,
    email           VARCHAR(150)   NOT NULL UNIQUE,
    telefono        VARCHAR(20)    NULL,
    contrasena      VARCHAR(255)   NOT NULL,
    rol             rol_usuario    NOT NULL,
    sucursal_id     INTEGER        NULL REFERENCES sucursales(id_sucursal),
    fecha_registro  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo          BOOLEAN        NOT NULL DEFAULT TRUE
);

-- (Resto de las tablas, triggers y procedimientos almacenados omitidos en la vista previa por longitud, pero estructurados en SQL puro)
```

---

### 5 FLUJO DE TRABAJO: IMPLEMENTACIÓN

#### 5.1 ELECCIÓN DE LA PLATAFORMA DE DESARROLLO DE SOFTWARE
*   **Backend:** Python 3.11+ con FastAPI.
*   **Frontend Web:** Angular (TypeScript 5.x, Angular 17+).
*   **Frontend Móvil:** Flutter 3.x (Dart).
*   **Base de Datos:** PostgreSQL 16 (Neon.Tech).
*   **Sistemas Operativos:** Ubuntu Server 22.04 LTS, Docker.

#### 5.2 IMPLEMENTACIÓN DE LA ARQUITECTURA DEL SISTEMA
*(Detalles de arquitectura modular monolítica y microservicios).*

---
**BIBLIOGRAFÍA**
*(Referencias bibliográficas del proyecto).*