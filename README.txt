===========================================================================
 FashionStore - Guia de instalacion e inicio
===========================================================================

Plataforma inteligente de comercio electronico para una cadena de tiendas
de ropa (sede principal: Santa Cruz de la Sierra, Bolivia).

Backend:  FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 18
Frontend: Angular + Angular Material
Pagos:    Stripe (modo sandbox)
Auth:     JWT + bcrypt
Despliegue: Docker / Docker Compose

---------------------------------------------------------------------------
 REQUISITOS PREVIOS
---------------------------------------------------------------------------
1) Python 3.12 instalado y agregado al PATH.
   (Ruta usada: C:\Users\HP\AppData\Local\Programs\Python\Python312)

2) PostgreSQL 18 instalado y el servicio CORRIENDO
   (servicio: postgresql-x64-18).
   Ruta de psql usada: C:\Program Files\PostgreSQL\18\bin\psql.exe

3) Base de datos "fashionstore" creada y poblada (ver seccion 1).

4) Node.js 22+ y npm instalados (para el frontend Angular).

5) [Opcional] Docker Desktop DEBE estar corriendo para usar Docker.


===========================================================================
 1) CREAR Y POBLAR LA BASE DE DATOS (solo la primera vez)
===========================================================================
Abre una terminal y ejecuta:

   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f "C:\<ruta>\
database\01_creacion_base_datos.sql"
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f "C:\<ruta>\
database\02_poblacion.sql"

   (Se te pedira la contrasena del usuario postgres; en este entorno es:
    09091991 )

NOTA: Si la base "fashionstore" no existe, creala primero con:
   CREATE DATABASE fashionstore;

El archivo 03_consultas.sql opcionalmente valida los datos con 30 consultas.


===========================================================================
 2) CREAR EL ENTORNO VIRTUAL E INSTALAR DEPENDENCIAS (Backend)
===========================================================================
En la carpeta del backend (backend/), ejecuta:

   python -m venv .venv

   .venv\Scripts\activate            (Windows)
   # o Linux/Mac: source .venv/bin/activate

   pip install -r requirements.txt


===========================================================================
 3) CONFIGURAR VARIABLES DE ENTORNO (opcional)
===========================================================================
Copia backend\.env.example a backend\.env y ajusta si hace falta:

   DATABASE_URL=postgresql+psycopg2://postgres:09091991@localhost:5432/fashionstore
   SECRET_KEY=tu-clave-secreta
   STRIPE_SECRET_KEY=sk_test_xxx        (modo sandbox)
   AI_API_KEY=                          (opcional)

Los valores por defecto ya funcionan para desarrollo local.


===========================================================================
 4) INICIAR EL SERVIDOR BACKEND
===========================================================================
Desde la carpeta backend/, con el entorno activado:

   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

El servidor quedara disponible en:

   API:      http://127.0.0.1:8000/
   Docs:     http://127.0.0.1:8000/docs
   OpenAPI:  http://127.0.0.1:8000/api/v1/openapi.json


===========================================================================
 5) INICIAR EL FRONTEND ANGULAR
===========================================================================
El frontend ya NO apunta a "127.0.0.1:8000" en produccion; durante el
desarrollo usa CORS y apunta a http://127.0.0.1:8000/api/v1.

En una NUEVA terminal, desde la carpeta frontend/:

   npm install

   ng serve --open        (o: npm start)

El frontend quedara disponible en:  http://localhost:4200

Flujo de uso web:
   - Registro:   http://localhost:4200/registro
   - Login:      http://localhost:4200/login
   - Dashboard:  http://localhost:4200/dashboard
   - Catalogo:   http://localhost:4200/catalogo

Nota: el backend debe estar corriendo (seccion 4) para que login,
registro y catalogo funcionen desde el frontend.


===========================================================================
 6) PROBAR LA API (mapeo de rutas)
===========================================================================
Health:       GET  http://127.0.0.1:8000/
Login:        POST http://127.0.0.1:8000/api/v1/auth/login
              { "email": "laura.vargas@gmail.com", "contrasena": "cliente123" }
              -> devuelve un access_token (Bearer)
Usuarios:     GET/PATCH /api/v1/usuarios
Sucursales:   GET /api/v1/sucursales
Catalogo:     GET /api/v1/catalogo/productos
              GET /api/v1/catalogo/categorias
Inventario:   GET /api/v1/inventario/disponibilidad?variante_id=1
Reservas:     POST /api/v1/reservas   (crear, CU8)
              GET  /api/v1/reservas   (listar, CU9)
Ventas:       POST /api/v1/ventas/presencial
              POST /api/v1/ventas/digital/payment-intent
              POST /api/v1/ventas/digital/confirmar
IA:           GET /api/v1/ia/recomendaciones

Para llamadas protegidas agrega el encabezado:
   Authorization: Bearer <access_token>

Usuarios de ejemplo (contrasenas en texto plano):
   admin:    admin@fashionstore.bo       / admin123
   encargado: juan.perez@fashionstore.bo / encargado123
   cajero:   carlos.rojas@fashionstore.bo/ cajero123
   cliente:  laura.vargas@gmail.com      / cliente123


===========================================================================
 7) DESPLIEGUE CON DOCKER (todo el stack)
===========================================================================
REQUISITO: Docker Desktop arrancado (el daemon debe estar corriendo).

Desde la RAIZ del proyecto (donde esta docker-compose.yml), ejecuta:

   docker compose up --build

Esto levanta 3 contenedores:
   - db:        PostgreSQL 18, base "fashionstore" creada y poblada
                automaticamente con los scripts de database/.
   - backend:   FastAPI en  http://localhost:8000
   - frontend:  Angular (nginx) en http://localhost  (puerto 80)

Para detener:      docker compose down
Para borrar datos: docker compose down -v
Para ver logs:     docker compose logs -f

Nota: en modo Docker el frontend usa /api/v1 relativo: nginx hace proxy
de /api/v1 al backend (no requiere configuracion de CORS).

Usuarios de ejemplo para login web: los mismos de la seccion 6.


===========================================================================
 8) MIGRACIONES ALEMBIC (opcional)
===========================================================================
El esquema ya existe y esta poblado en la BD (los modelos estan sincronizados).
Si deseas generar la migracion baseline para versionar:

   alembic init alembic        (ya configurado: alembic.ini + alembic/env.py)
   alembic revision --autogenerate -m "baseline"
   alembic upgrade head


===========================================================================
 CREDENCIALES Y NOTAS
===========================================================================
- PostgreSQL:  usuario postgres / 09091991   (base: fashionstore)
- Stripe:      modo sandbox (sin clave real no cobra, simula pago aprobado)
- CORS:        configurado con allow_origins=["*"] para desarrollo.
              Restringirlo en produccion (app/main.py).
- Docker:      volumen "pgdata" persiste la base de datos entre reinicios.
===========================================================================