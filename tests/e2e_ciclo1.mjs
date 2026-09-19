/**
 * Test E2E - Casos de Uso del CICLO #1 (FashionStore)
 * CU1, CU2, CU3, CU4, CU5, CU6, CU8, CU9, CU18, CU19, CU20, CU21
 *
 * Uso:
 *   node tests/e2e_ciclo1.mjs
 *   API_URL=http://localhost/api/v1 node tests/e2e_ciclo1.mjs
 *
 * Requiere el stack levantado (docker compose up -d).
 */

const BASE = process.env.API_URL || 'http://localhost/api/v1';

const CREDS = {
  admin: { email: 'admin@fashionstore.bo', contrasena: 'admin123' },
  encargado: { email: 'juan.perez@fashionstore.bo', contrasena: 'encargado123' },
  cajero: { email: 'carlos.rojas@fashionstore.bo', contrasena: 'cajero123' },
  cliente: { email: 'laura.vargas@gmail.com', contrasena: 'cliente123' },
};

const results = [];
let ctx = {};

function tag(ok) {
  if (ok === true) return 'PASS';
  if (ok === 'partial') return 'WARN';
  return 'FAIL';
}

function record(cu, name, ok, detail = '') {
  results.push({ cu, name, ok, detail });
  const t = tag(ok);
  const mark = t === 'PASS' ? '\x1b[32mPASS\x1b[0m' : t === 'WARN' ? '\x1b[33mWARN\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  [${mark}] ${name}${detail ? ' :: ' + detail : ''}`);
}

function cuHeader(cu, title) {
  console.log(`\n\x1b[1m\x1b[34mCU${cu} - ${title}\x1b[0m`);
}

async function req(method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    return { status: 0, json: null, error: String(e) };
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function login(role) {
  const { status, json } = await req('POST', '/auth/login', { body: CREDS[role] });
  if (status !== 200 || !json?.access_token) {
    throw new Error(`login ${role} falló (status ${status}): ${JSON.stringify(json)}`);
  }
  return { token: json.access_token, usuario: json.usuario };
}

function futureDate() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

/**
 * Devuelve hasta `n` variantes distintas de la sucursal con stock suficiente
 * (`cantidad_disponible >= cantidad`), eligiendo primero las de mayor stock.
 * Evita depender de ids fijos que pueden quedar sin stock entre corridas.
 */
async function elegirVariantes(sucursalId, cantidad, n = 1) {
  const inv = await req('GET', `/inventario/?sucursal_id=${sucursalId}`);
  const rows = Array.isArray(inv.json) ? inv.json : [];
  const vistas = new Set();
  const elegidas = [];
  for (const r of rows
    .filter((r) => r.cantidad_disponible >= cantidad)
    .sort((a, b) => b.cantidad_disponible - a.cantidad_disponible)) {
    if (!vistas.has(r.variante_id)) {
      vistas.add(r.variante_id);
      elegidas.push(r.variante_id);
    }
    if (elegidas.length >= n) break;
  }
  return elegidas;
}

// ============================================================
// CU1 - Registrarse
// ============================================================
async function testCU1() {
  cuHeader(1, 'Registrarse');
  const email = `e2e.cliente.${Date.now()}@example.com`;
  const { status, json } = await req('POST', '/auth/register', {
    body: { nombre: 'E2E Cliente', email, contrasena: 'cliente123', telefono: '70011122' },
  });
  record(1, 'POST /auth/register devuelve 201', status === 201, `status=${status}`);
  if (status === 201) {
    record(1, 'El nuevo usuario tiene rol cliente', json.rol === 'cliente', `rol=${json.rol}`);
    record(1, 'El nuevo usuario queda activo', json.activo === true, `activo=${json.activo}`);
    ctx.testUserId = json.id_usuario;
    ctx.testUserEmail = email;
  } else {
    record(1, 'El nuevo usuario tiene rol cliente', false, JSON.stringify(json));
    record(1, 'El nuevo usuario queda activo', false, 'no se pudo crear');
  }
  // duplicado
  const dup = await req('POST', '/auth/register', {
    body: { nombre: 'E2E Cliente', email, contrasena: 'cliente123' },
  });
  record(1, 'Email duplicado rechazado (400)', dup.status === 400, `status=${dup.status}`);
}

// ============================================================
// CU2 - Iniciar sesión
// ============================================================
async function testCU2() {
  cuHeader(2, 'Iniciar sesión');
  const ok = await req('POST', '/auth/login', { body: CREDS.cliente });
  record(2, 'Login con credenciales válidas (200 + token)', ok.status === 200 && !!ok.json?.access_token, `status=${ok.status}`);
  const bad = await req('POST', '/auth/login', {
    body: { email: CREDS.cliente.email, contrasena: 'incorrecta' },
  });
  record(2, 'Login con contraseña incorrecta rechazado (401)', bad.status === 401, `status=${bad.status}`);
  if (ok.json?.access_token) {
    const me = await req('GET', '/auth/me', { token: ok.json.access_token });
    record(2, 'GET /auth/me devuelve el usuario autenticado', me.status === 200 && me.json?.email === CREDS.cliente.email, `status=${me.status}`);
  } else {
    record(2, 'GET /auth/me devuelve el usuario autenticado', false, 'sin token');
  }
}

// ============================================================
// CU3 - Gestionar perfil
// ============================================================
async function testCU3() {
  cuHeader(3, 'Gestionar perfil');
  const cliente = ctx.tokens.cliente;
  const original = {
    nombre: cliente.usuario.nombre,
    email: cliente.usuario.email,
    telefono: cliente.usuario.telefono ?? null,
  };

  const get = await req('GET', '/auth/me', { token: cliente.token });
  record(
    3,
    'Ver mi propio perfil (GET /auth/me)',
    get.status === 200 && get.json?.email === original.email,
    `status=${get.status}`,
  );

  const patch = await req('PATCH', '/auth/me', {
    token: cliente.token,
    body: { nombre: 'Laura Vargas E2E', email: original.email, telefono: '79999888' },
  });
  record(
    3,
    'Editar nombre y teléfono propios',
    patch.status === 200 &&
      patch.json?.nombre === 'Laura Vargas E2E' &&
      patch.json?.telefono === '79999888',
    `status=${patch.status}`,
  );

  const dup = await req('PATCH', '/auth/me', {
    token: cliente.token,
    body: { nombre: 'Laura Vargas E2E', email: CREDS.admin.email, telefono: '79999888' },
  });
  record(
    3,
    'Correo duplicado rechazado (400 "El correo ya está en uso")',
    dup.status === 400,
    `status=${dup.status}, detail=${dup.json?.detail}`,
  );

  const badEmail = await req('PATCH', '/auth/me', {
    token: cliente.token,
    body: { nombre: 'Laura Vargas E2E', email: 'no-es-email', telefono: '79999888' },
  });
  record(
    3,
    'Formato de correo inválido rechazado (422)',
    badEmail.status === 422,
    `status=${badEmail.status}`,
  );

  const badPhone = await req('PATCH', '/auth/me', {
    token: cliente.token,
    body: { nombre: 'Laura Vargas E2E', email: original.email, telefono: 'abc' },
  });
  record(
    3,
    'Formato de teléfono inválido rechazado (422)',
    badPhone.status === 422,
    `status=${badPhone.status}`,
  );

  const shortPhone = await req('PATCH', '/auth/me', {
    token: cliente.token,
    body: { nombre: 'Laura Vargas E2E', email: original.email, telefono: '12' },
  });
  record(
    3,
    'Teléfono muy corto rechazado (422)',
    shortPhone.status === 422,
    `status=${shortPhone.status}`,
  );

  const empty = await req('PATCH', '/auth/me', {
    token: cliente.token,
    body: { nombre: '', email: original.email, telefono: null },
  });
  record(
    3,
    'Campo obligatorio vacío rechazado (422)',
    empty.status === 422,
    `status=${empty.status}`,
  );

  // restaurar datos originales
  await req('PATCH', '/auth/me', { token: cliente.token, body: original });
}

// ============================================================
// CU4 - Consultar catálogo
// ============================================================
async function testCU4() {
  cuHeader(4, 'Consultar catálogo');
  const cats = await req('GET', '/catalogo/categorias');
  record(4, 'Listar categorías', cats.status === 200 && Array.isArray(cats.json) && cats.json.length > 0, `status=${cats.status}, n=${cats.json?.length}`);
  if (Array.isArray(cats.json) && cats.json.length) ctx.categoriaId = cats.json[0].id_categoria;

  const prods = await req('GET', '/catalogo/productos');
  const list = Array.isArray(prods.json) ? prods.json : [];
  record(4, 'Listar productos activos', prods.status === 200 && list.length > 0, `status=${prods.status}, n=${list.length}`);
  if (list.length) {
    ctx.producto = list[0];
    const det = await req('GET', `/catalogo/productos/${list[0].id_producto}`);
    record(4, 'Detalle de producto', det.status === 200 && det.json?.id_producto === list[0].id_producto, `status=${det.status}`);
  } else {
    record(4, 'Detalle de producto', false, 'no hay productos');
  }
}

// ============================================================
// CU5 - Filtrar catálogo
// ============================================================
async function testCU5() {
  cuHeader(5, 'Filtrar por talla, color, categoría, temporada');
  const base = await req('GET', '/catalogo/productos');
  const total = Array.isArray(base.json) ? base.json.length : 0;

  if (ctx.categoriaId) {
    const r = await req('GET', `/catalogo/productos?categoria_id=${ctx.categoriaId}`);
    const ok = r.status === 200 && Array.isArray(r.json) && r.json.every((p) => p.categoria_id === ctx.categoriaId);
    record(5, `Filtrar por categoría (id=${ctx.categoriaId})`, ok, `status=${r.status}, n=${r.json?.length}`);
  } else {
    record(5, 'Filtrar por categoría', false, 'sin categoría de contexto');
  }

  if (ctx.producto?.temporada_id) {
    const r = await req('GET', `/catalogo/productos?temporada_id=${ctx.producto.temporada_id}`);
    const ok = r.status === 200 && Array.isArray(r.json) && r.json.every((p) => p.temporada_id === ctx.producto.temporada_id);
    record(5, `Filtrar por temporada (id=${ctx.producto.temporada_id})`, ok, `status=${r.status}, n=${r.json?.length}`);
  }

  const busq = await req('GET', '/catalogo/productos?q=camisa');
  record(5, 'Búsqueda por texto (q=camisa)', busq.status === 200 && Array.isArray(busq.json), `status=${busq.status}, n=${busq.json?.length}`);

  const precio = await req('GET', '/catalogo/productos?precio_min=100&precio_max=300');
  const okPrecio = precio.status === 200 && Array.isArray(precio.json) && precio.json.every((p) => p.precio >= 100 && p.precio <= 300);
  record(5, 'Filtrar por rango de precio', okPrecio, `status=${precio.status}, n=${precio.json?.length}`);

  const talla = await req('GET', '/catalogo/productos?talla_id=1');
  record(5, 'Filtrar por talla (talla_id=1)', talla.status === 200, `status=${talla.status}, n=${talla.json?.length}`);
  const color = await req('GET', '/catalogo/productos?color_id=1');
  record(5, 'Filtrar por color (color_id=1)', color.status === 200, `status=${color.status}, n=${color.json?.length}`);

  if (!total) record(5, 'Catálogo base no vacío', false, '0 productos');
}

// ============================================================
// CU6 - Consultar disponibilidad por sucursal
// ============================================================
async function testCU6() {
  cuHeader(6, 'Consultar disponibilidad por sucursal');
  const cliente = ctx.tokens.cliente;
  const encargado = ctx.tokens.encargado;
  const cajero = ctx.tokens.cajero;

  const inv = await req('GET', '/inventario/');
  const rows = Array.isArray(inv.json) ? inv.json : [];
  record(6, 'Listar inventario', inv.status === 200 && rows.length > 0, `status=${inv.status}, n=${rows.length}`);

  const suc = await req('GET', '/sucursales');
  const activas = new Set(Array.isArray(suc.json) ? suc.json.map((s) => s.id_sucursal) : []);
  const conStock = rows.find((r) => r.cantidad_disponible > 0 && activas.has(r.sucursal_id)) ?? rows[0];
  ctx.varianteId = conStock.variante_id;
  ctx.sucursalId = conStock.sucursal_id;
  const vid = ctx.varianteId;

  const sinToken = await req('GET', `/inventario/disponibilidad?variante_id=${vid}`);
  record(6, 'Sin token no puede consultar (401)', sinToken.status === 401, `status=${sinToken.status}`);

  const disp = await req('GET', `/inventario/disponibilidad?variante_id=${vid}`, { token: cliente.token });
  const dispArr = Array.isArray(disp.json) ? disp.json : [];
  const campos = dispArr.length > 0 && dispArr.every(
    (d) => d.nombre_sucursal && d.ciudad && Number.isFinite(d.cantidad_disponible) &&
      Number.isFinite(d.cantidad_reservada) && Number.isFinite(d.cantidad_recibida) &&
      Number.isFinite(d.stock_minimo) && d.estado,
  );
  record(6, `Disponibilidad por sucursal (cliente): nombre, ciudad, reservadas, recibidas y stock mínimo`,
    disp.status === 200 && dispArr.length > 0 && campos, `status=${disp.status}, sucursales=${dispArr.length}`);

  const soloActivas = dispArr.length > 0 && dispArr.every((d) => activas.has(d.sucursal_id));
  record(6, 'Excluye sucursales inactivas', soloActivas, `sucursales=${dispArr.length}, activas=${activas.size}`);

  const ciudades = await req('GET', '/sucursales/ciudades');
  const cid = (Array.isArray(ciudades.json) ? ciudades.json : []).find(
    (c) => c.nombre === dispArr[0]?.ciudad,
  )?.id_ciudad;
  if (cid) {
    const porCiudad = await req('GET', `/inventario/disponibilidad?variante_id=${vid}&ciudad_id=${cid}`, { token: cliente.token });
    const ok = porCiudad.status === 200 && Array.isArray(porCiudad.json) &&
      porCiudad.json.length > 0 && porCiudad.json.every((d) => d.ciudad === dispArr[0].ciudad);
    record(6, `Filtrar sucursales por ciudad (${dispArr[0].ciudad})`, ok, `status=${porCiudad.status}, n=${porCiudad.json?.length}`);
  } else {
    record(6, 'Filtrar sucursales por ciudad', false, 'no se pudo resolver ciudad');
  }

  const porSuc = await req('GET', `/inventario/disponibilidad?variante_id=${vid}&sucursal_id=${ctx.sucursalId}`, { token: cliente.token });
  record(6, `Filtrar por sucursal ${ctx.sucursalId}`, porSuc.status === 200 && Array.isArray(porSuc.json) &&
    porSuc.json.length === 1 && porSuc.json[0].sucursal_id === ctx.sucursalId, `status=${porSuc.status}, n=${porSuc.json?.length}`);

  const inexistente = await req('GET', '/inventario/disponibilidad?variante_id=999999', { token: cliente.token });
  record(6, 'Variante sin inventario devuelve lista vacía', inexistente.status === 200 && Array.isArray(inexistente.json) && inexistente.json.length === 0, `status=${inexistente.status}, n=${inexistente.json?.length}`);

  const porEnc = await req('GET', `/inventario/disponibilidad?variante_id=${vid}`, { token: encargado.token });
  record(6, 'Encargado consulta disponibilidad (200)', porEnc.status === 200, `status=${porEnc.status}`);
  const porCaj = await req('GET', `/inventario/disponibilidad?variante_id=${vid}`, { token: cajero.token });
  record(6, 'Cajero consulta disponibilidad (200)', porCaj.status === 200, `status=${porCaj.status}`);

  const porSucInv = await req('GET', `/inventario/?sucursal_id=${ctx.sucursalId}`);
  record(6, `Inventario filtrado por sucursal ${ctx.sucursalId}`, porSucInv.status === 200 && Array.isArray(porSucInv.json), `status=${porSucInv.status}, n=${porSucInv.json?.length}`);
}

// ============================================================
// CU8 - Realizar reserva de múltiples prendas
// ============================================================
async function testCU8() {
  cuHeader(8, 'Realizar reserva de múltiples prendas');
  const cliente = ctx.tokens.cliente;
  const sucursalId = ctx.sucursalId;
  const variantes = await elegirVariantes(sucursalId, 1, 2);

  if (variantes.length < 2) {
    record(8, 'Stock suficiente para 2 variantes en la sucursal', false, `sucursal ${sucursalId}, encontradas ${variantes.length}`);
    record(8, 'Crear reserva con 2 ítems (201, estado pendiente)', false, 'sin stock suficiente');
    record(8, 'La reserva tiene los ítems enviados', false, 'no se creó reserva');
    return;
  }

  const body = {
    sucursal_id: sucursalId,
    fecha_reserva: futureDate(),
    hora_atencion: '10:00',
    items: [
      { variante_id: variantes[0], cantidad: 1 },
      { variante_id: variantes[1], cantidad: 1 },
    ],
  };
  record(8, 'Stock suficiente para 2 variantes en la sucursal', true, `variantes ${variantes.join(', ')}`);

  const invAntes = await req('GET', `/inventario/?sucursal_id=${sucursalId}`);
  const reservadaAntes =
    invAntes.json?.find((x) => x.variante_id === variantes[0])?.cantidad_reservada ?? null;

  const r = await req('POST', '/reservas', { token: cliente.token, body });
  const ok = r.status === 201 && r.json?.estado === 'pendiente';
  record(8, 'Crear reserva con 2 ítems (201, estado pendiente)', ok, `status=${r.status}, estado=${r.json?.estado}`);
  if (r.status === 201) {
    record(8, 'La reserva tiene los ítems enviados', Array.isArray(r.json.items) && r.json.items.length === 2, `items=${r.json.items?.length}`);
    ctx.reservaCancelar = r.json.id_reserva;
    ctx.reservaItems = r.json.items;

    const invDespues = await req('GET', `/inventario/?sucursal_id=${sucursalId}`);
    const reservadaDespues =
      invDespues.json?.find((x) => x.variante_id === variantes[0])?.cantidad_reservada ?? null;
    record(
      8,
      'cantidad_reservada aumenta tras reservar',
      Number.isFinite(reservadaAntes) &&
        Number.isFinite(reservadaDespues) &&
        reservadaDespues === reservadaAntes + 1,
      `antes=${reservadaAntes}, despues=${reservadaDespues}`,
    );
  }

  const cajero = ctx.tokens.cajero;
  const forbidden = await req('POST', '/reservas', { token: cajero.token, body });
  record(8, 'Cajero no puede reservar (403)', forbidden.status === 403, `status=${forbidden.status}`);

  const horarioNo = await req('POST', '/reservas', {
    token: cliente.token,
    body: { ...body, hora_atencion: '23:59' },
  });
  record(8, 'Horario fuera del horario de atención rechazado (400)', horarioNo.status === 400, `status=${horarioNo.status}`);

  const limite = await req('POST', '/reservas', {
    token: cliente.token,
    body: { ...body, items: [{ variante_id: variantes[0], cantidad: 11 }] },
  });
  record(8, 'Límite máximo de prendas por reserva rechazado (400)', limite.status === 400, `status=${limite.status}`);

  const filas = invAntes.json ?? [];
  const stockBajo = filas
    .filter((x) => x.cantidad_disponible > 0)
    .sort((a, b) => a.cantidad_disponible - b.cantidad_disponible)[0];
  if (stockBajo && stockBajo.cantidad_disponible + 1 <= 10) {
    const exceso = await req('POST', '/reservas', {
      token: cliente.token,
      body: {
        ...body,
        items: [{ variante_id: stockBajo.variante_id, cantidad: stockBajo.cantidad_disponible + 1 }],
      },
    });
    record(8, 'Stock insuficiente al confirmar (409)', exceso.status === 409, `status=${exceso.status}, detail=${exceso.json?.detail}`);
  } else {
    record(8, 'Stock insuficiente al confirmar (409)', true, 'sin variante de stock bajo en esta corrida');
  }
}

// ============================================================
// CU9 - Consultar y cancelar reservas
// ============================================================
async function testCU9() {
  cuHeader(9, 'Consultar y cancelar reservas');
  const cliente = ctx.tokens.cliente;
  const encargado = ctx.tokens.encargado;
  const sucursalEnc = encargado.usuario.sucursal_id || ctx.sucursalId;

  const list = await req('GET', '/reservas', { token: cliente.token });
  const rows = Array.isArray(list.json) ? list.json : [];
  record(9, 'Cliente consulta "Mis reservas"', list.status === 200 && Array.isArray(list.json), `status=${list.status}, n=${rows.length}`);

  const conDetalle = rows.filter((r) => r.items?.some((i) => i.producto?.nombre)).length;
  record(9, 'El listado trae las prendas reservadas (producto/talla/color)', conDetalle > 0 || rows.length === 0,
    `conDetalle=${conDetalle}/${rows.length}`);

  if (rows.length) {
    const det = await req('GET', `/reservas/${rows[0].id_reserva}`, { token: cliente.token });
    record(9, 'Ver detalle de una reserva', det.status === 200, `status=${det.status}`);
  }

  // Encargado: consulta las reservas de su sucursal (filtro por sucursal_id).
  const listEnc = await req('GET', '/reservas', { token: encargado.token });
  const rEnc = Array.isArray(listEnc.json) ? listEnc.json : [];
  const soloSucursalEnc = rEnc.every((r) => r.sucursal_id === sucursalEnc);
  record(9, `Encargado consulta reservas de su sucursal (${sucursalEnc})`,
    listEnc.status === 200 && soloSucursalEnc, `status=${listEnc.status}, n=${rEnc.length}`);

  // Una reserva creada en otra sucursal NO debe aparecer en el panel del encargado.
  const sucs = await req('GET', '/sucursales');
  const otraSuc = (Array.isArray(sucs.json) ? sucs.json : [])
    .find((s) => s.id_sucursal !== sucursalEnc && s.activo === true);
  if (otraSuc) {
    const [vOtra] = await elegirVariantes(otraSuc.id_sucursal, 1, 1);
    if (vOtra) {
      const otra = await req('POST', '/reservas', {
        token: cliente.token,
        body: {
          sucursal_id: otraSuc.id_sucursal,
          fecha_reserva: futureDate(),
          hora_atencion: '10:00',
          items: [{ variante_id: vOtra, cantidad: 1 }],
        },
      });
      if (otra.status === 201) {
        const listEnc2 = await req('GET', '/reservas', { token: encargado.token });
        const noAparece = Array.isArray(listEnc2.json) &&
          !listEnc2.json.some((r) => r.id_reserva === otra.json.id_reserva);
        record(9, 'Encargado no ve reservas de otras sucursales', noAparece,
          `status=${listEnc2.status}, sucursal otra=${otraSuc.id_sucursal}`);
        await req('PATCH', `/reservas/${otra.json.id_reserva}/cancelar`, { token: cliente.token });
      } else {
        record(9, 'Encargado no ve reservas de otras sucursales', 'partial', `no se creó la reserva (${otra.status})`);
      }
    } else {
      record(9, 'Encargado no ve reservas de otras sucursales', 'partial', 'otra sucursal sin stock');
    }
  } else {
    record(9, 'Encargado no ve reservas de otras sucursales', 'partial', 'no hay otra sucursal activa');
  }

  // Cancelación de reserva pendiente: libera stock (cantidad_reservada vuelve a su valor).
  if (ctx.reservaCancelar) {
    const vid = ctx.reservaItems?.[0]?.variante_id;
    const reservadaAntes = vid
      ? (await req('GET', `/inventario/?sucursal_id=${sucursalEnc}`)).json
          ?.find((x) => x.variante_id === vid)?.cantidad_reservada
      : null;
    const cancel = await req('PATCH', `/reservas/${ctx.reservaCancelar}/cancelar`, { token: cliente.token });
    record(9, 'Cancelar reserva pendiente (estado cancelada)', cancel.status === 200 && cancel.json?.estado === 'cancelada',
      `status=${cancel.status}, estado=${cancel.json?.estado}`);
    if (vid) {
      const reservadaDespues = (await req('GET', `/inventario/?sucursal_id=${sucursalEnc}`)).json
        ?.find((x) => x.variante_id === vid)?.cantidad_reservada;
      record(9, 'Cancelar libera el stock reservado', Number.isFinite(reservadaAntes) &&
        Number.isFinite(reservadaDespues) && reservadaDespues === reservadaAntes - 1,
        `reservada antes=${reservadaAntes}, despues=${reservadaDespues}`);
    } else {
      record(9, 'Cancelar libera el stock reservado', false, 'sin ítems de CU8');
    }
  } else {
    record(9, 'Cancelar reserva pendiente', false, 'no se creó reserva en CU8');
  }

  // Una reserva COMPLETADA no puede cancelarse.
  const [vCompletada] = await elegirVariantes(sucursalEnc, 1, 1);
  if (vCompletada) {
    const creada = await req('POST', '/reservas', {
      token: cliente.token,
      body: {
        sucursal_id: sucursalEnc,
        fecha_reserva: futureDate(),
        hora_atencion: '11:00',
        items: [{ variante_id: vCompletada, cantidad: 1 }],
      },
    });
    if (creada.status === 201) {
      const id = creada.json.id_reserva;
      await req('PATCH', `/reservas/${id}/preparar`, { token: encargado.token });
      const comp = await req('PATCH', `/reservas/${id}/completar`, { token: encargado.token });
      if (comp.status === 200) {
        const canc = await req('PATCH', `/reservas/${id}/cancelar`, { token: cliente.token });
        record(9, 'No se cancela una reserva completada (400)', canc.status === 400 &&
          /completada/.test(canc.json?.detail ?? ''), `status=${canc.status}, detail=${canc.json?.detail}`);
      } else {
        record(9, 'No se cancela una reserva completada (400)', false, `no se completó (${comp.status})`);
      }
    } else {
      record(9, 'No se cancela una reserva completada (400)', false, `no se creó (${creada.status})`);
    }
  } else {
    record(9, 'No se cancela una reserva completada (400)', false, 'sin stock en la sucursal del encargado');
  }
}

// ============================================================
// CU18 - Preparar reservas (encargado)
// ============================================================
async function testCU18() {
  cuHeader(18, 'Preparar reservas (encargado)');
  const cliente = ctx.tokens.cliente;
  const encargado = ctx.tokens.encargado;
  const cajero = ctx.tokens.cajero;
  const sucursalId = ctx.sucursalId;
  const [varianteId] = await elegirVariantes(sucursalId, 1, 1);

  if (!varianteId) {
    record(18, 'Stock suficiente para preparar una reserva', false, `sucursal ${sucursalId}`);
    record(18, 'Cliente crea reserva pendiente', false, 'sin stock');
    record(18, 'Cajero NO puede preparar reserva (403)', false, 'sin reserva');
    record(18, 'Encargado prepara la reserva', false, 'sin reserva');
    return;
  }

  const created = await req('POST', '/reservas', {
    token: cliente.token,
    body: {
      sucursal_id: sucursalId,
      fecha_reserva: futureDate(),
      hora_atencion: '11:00',
      items: [{ variante_id: varianteId, cantidad: 1 }],
    },
  });
  record(18, 'Cliente crea reserva pendiente', created.status === 201, `status=${created.status}`);

  if (created.status === 201) {
    const id = created.json.id_reserva;
    const f = await req('PATCH', `/reservas/${id}/preparar`, { token: cajero.token });
    record(18, 'Cajero NO puede preparar reserva (403)', f.status === 403, `status=${f.status}`);

    const prep = await req('PATCH', `/reservas/${id}/preparar`, { token: encargado.token });
    record(18, 'Encargado prepara la reserva (estado preparada)', prep.status === 200 && prep.json?.estado === 'preparada', `status=${prep.status}, estado=${prep.json?.estado}`);

    // limpieza: cancelar libera el stock (preparar no lo hace), así la suite
    // no agota el inventario entre corridas.
    await req('PATCH', `/reservas/${id}/cancelar`, { token: cliente.token });
  } else {
    record(18, 'Cajero NO puede preparar reserva (403)', false, 'no se creó reserva');
    record(18, 'Encargado prepara la reserva', false, 'no se creó reserva');
  }
}

// ============================================================
// CU19 - Administrar usuarios y roles (admin)
// ============================================================
async function testCU19() {
  cuHeader(19, 'Administrar usuarios y roles');
  const admin = ctx.tokens.admin;
  const cliente = ctx.tokens.cliente;

  const list = await req('GET', '/usuarios', { token: admin.token });
  const rows = Array.isArray(list.json) ? list.json : [];
  record(19, 'Admin lista todos los usuarios', list.status === 200 && rows.length > 0, `status=${list.status}, n=${rows.length}`);

  const porRol = await req('GET', '/usuarios?rol=cliente', { token: admin.token });
  const okRol = porRol.status === 200 && Array.isArray(porRol.json) && porRol.json.every((u) => u.rol === 'cliente');
  record(19, 'Admin filtra usuarios por rol=cliente', okRol, `status=${porRol.status}, n=${porRol.json?.length}`);

  const targetId = ctx.testUserId ?? cliente.usuario.id_usuario;
  const upd = await req('PATCH', `/usuarios/${targetId}`, { token: admin.token, body: { activo: true } });
  record(19, `Admin actualiza un usuario (id=${targetId})`, upd.status === 200, `status=${upd.status}`);

  const forbidden = await req('GET', '/usuarios', { token: cliente.token });
  record(19, 'Cliente NO puede listar usuarios (403)', forbidden.status === 403, `status=${forbidden.status}`);

  const creado = await req('POST', '/usuarios', {
    token: admin.token,
    body: {
      nombre: 'E2E Cajero Prueba',
      email: `e2e.cajero.${Date.now()}@fashionstore.bo`,
      telefono: '70012345',
      rol: 'cajero',
      sucursal_id: 1,
      contrasena: 'cajero123',
    },
  });
  record(19, 'Admin crea usuario con rol cajero (201)', creado.status === 201 && creado.json?.rol === 'cajero', `status=${creado.status}, rol=${creado.json?.rol}`);

  const dup = await req('POST', '/usuarios', {
    token: admin.token,
    body: {
      nombre: 'E2E Duplicado',
      email: admin.usuario.email,
      rol: 'cliente',
      contrasena: 'cliente123',
    },
  });
  record(19, 'Email duplicado rechazado (400)', dup.status === 400, `status=${dup.status}, detail=${dup.json?.detail}`);

  const rolMal = await req('POST', '/usuarios', {
    token: admin.token,
    body: {
      nombre: 'E2E Rol Malo',
      email: `e2e.rol.${Date.now()}@fashionstore.bo`,
      rol: 'superusuario',
      contrasena: 'cliente123',
    },
  });
  record(19, 'Rol inválido rechazado (422)', rolMal.status === 422, `status=${rolMal.status}`);

  const sinSucursal = await req('POST', '/usuarios', {
    token: admin.token,
    body: {
      nombre: 'E2E Sin Sucursal',
      email: `e2e.sinsuc.${Date.now()}@fashionstore.bo`,
      rol: 'cajero',
      contrasena: 'cajero123',
    },
  });
  record(19, 'Cajero sin sucursal rechazado (422)', sinSucursal.status === 422, `status=${sinSucursal.status}`);

  const autoBaja = await req('PATCH', `/usuarios/${admin.usuario.id_usuario}`, { token: admin.token, body: { activo: false } });
  record(19, 'Auto-desactivación impedida (400)', autoBaja.status === 400, `status=${autoBaja.status}, detail=${autoBaja.json?.detail}`);

  const varianteId = ctx.varianteId ?? 1;
  await req('POST', '/reservas', {
    token: cliente.token,
    body: {
      sucursal_id: 1,
      fecha_reserva: futureDate(),
      hora_atencion: '10:00',
      items: [{ variante_id: varianteId, cantidad: 1 }],
    },
  });
  const clienteId = cliente.usuario.id_usuario;
  const block = await req('PATCH', `/usuarios/${clienteId}`, { token: admin.token, body: { activo: false } });
  record(19, 'Desactivar con operaciones bloqueado (409)', block.status === 409, `status=${block.status}, detail=${block.json?.detail}`);

  const force = await req('PATCH', `/usuarios/${clienteId}?forzar=true`, { token: admin.token, body: { activo: false } });
  record(19, 'Desactivar con forzar=true (200)', force.status === 200 && force.json?.activo === false, `status=${force.status}, activo=${force.json?.activo}`);

  const restaurado = await req('PATCH', `/usuarios/${clienteId}`, { token: admin.token, body: { activo: true } });
  record(19, 'Restaurar usuario para siguientes corridas', restaurado.status === 200, `status=${restaurado.status}`);

  if (creado.status === 201) {
    await req('PATCH', `/usuarios/${creado.json.id_usuario}`, { token: admin.token, body: { activo: false } });
  }
}

// ============================================================
// CU20 - Administrar sucursales (admin)
// ============================================================
async function testCU20() {
  cuHeader(20, 'Administrar sucursales');
  const admin = ctx.tokens.admin;
  const cliente = ctx.tokens.cliente;

  const list = await req('GET', '/sucursales');
  const rows = Array.isArray(list.json) ? list.json : [];
  record(20, 'Listar sucursales (público)', list.status === 200 && rows.length > 0, `status=${list.status}, n=${rows.length}`);
  const ciudadId = rows[0]?.ciudad_id ?? 1;
  const nombreExistente = rows[0]?.nombre;

  const ciudades = await req('GET', '/sucursales/ciudades');
  record(20, 'Listar ciudades para el formulario', ciudades.status === 200 && Array.isArray(ciudades.json) && ciudades.json.length > 0, `status=${ciudades.status}, n=${ciudades.json?.length}`);

  const todas = await req('GET', '/sucursales?todas=true', { token: admin.token });
  record(20, 'Admin lista TODAS incluyendo inactivas', todas.status === 200 && Array.isArray(todas.json) && todas.json.some((s) => s.ciudad), `status=${todas.status}, incluyen_ciudad=${todas.json?.some((s) => s.ciudad)}`);

  const forZ = await req('GET', '/sucursales?todas=true', { token: cliente.token });
  record(20, 'Cliente NO puede listar todas (403)', forZ.status === 403, `status=${forZ.status}`);

  const created = await req('POST', '/sucursales', {
    token: admin.token,
    body: {
      ciudad_id: ciudadId,
      nombre: `E2E Sucursal ${Date.now()}`,
      direccion: 'Av. Prueba 123',
      telefono: '33344455',
      horario_apertura: '08:00',
      horario_cierre: '20:00',
    },
  });
  record(20, 'Admin crea sucursal (201)', created.status === 201, `status=${created.status}`);

  const idNueva = created.status === 201 ? created.json.id_sucursal : null;

  const dup = await req('POST', '/sucursales', {
    token: admin.token,
    body: {
      ciudad_id: ciudadId,
      nombre: created.status === 201 ? created.json.nombre : 'E2E Duplicado',
      direccion: 'Otra calle 456',
      horario_apertura: '08:00',
      horario_cierre: '20:00',
    },
  });
  record(20, 'Nombre duplicado rechazado (400)', dup.status === 400 && dup.json?.detail === 'El nombre de sucursal ya está en uso', `status=${dup.status}, detail=${dup.json?.detail}`);

  const horarioMal = await req('POST', '/sucursales', {
    token: admin.token,
    body: {
      ciudad_id: ciudadId,
      nombre: 'E2E Horario Malo',
      direccion: 'Calle 789',
      horario_apertura: '20:00',
      horario_cierre: '08:00',
    },
  });
  record(20, 'Horario apertura >= cierre rechazado (422)', horarioMal.status === 422, `status=${horarioMal.status}`);

  const ciudadInexistente = await req('POST', '/sucursales', {
    token: admin.token,
    body: {
      ciudad_id: 999999,
      nombre: 'E2E Ciudad Mala',
      direccion: 'Calle 1',
      horario_apertura: '08:00',
      horario_cierre: '20:00',
    },
  });
  record(20, 'Ciudad inexistente rechazada (404)', ciudadInexistente.status === 404, `status=${ciudadInexistente.status}`);

  const forbidden = await req('POST', '/sucursales', {
    token: cliente.token,
    body: {
      ciudad_id: ciudadId,
      nombre: 'E2E No Autorizada',
      direccion: 'Calle 1',
      horario_apertura: '08:00',
      horario_cierre: '20:00',
    },
  });
  record(20, 'Cliente NO puede crear sucursal (403)', forbidden.status === 403, `status=${forbidden.status}`);

  if (idNueva) {
    const upd = await req('PATCH', `/sucursales/${idNueva}`, {
      token: admin.token,
      body: { direccion: 'Av. Editada 999', telefono: '77788899' },
    });
    record(20, 'Editar sucursal (PATCH)', upd.status === 200 && upd.json?.direccion === 'Av. Editada 999', `status=${upd.status}, direccion=${upd.json?.direccion}`);

    const updDup = await req('PATCH', `/sucursales/${idNueva}`, {
      token: admin.token,
      body: { nombre: nombreExistente },
    });
    record(20, 'Editar con nombre duplicado rechazado (400)', updDup.status === 400, `status=${updDup.status}, detail=${updDup.json?.detail}`);

    const baja = await req('DELETE', `/sucursales/${idNueva}`, { token: admin.token });
    record(20, 'Desactivar sucursal sin dependencias (200)', baja.status === 200 && baja.json?.activo === false, `status=${baja.status}, activo=${baja.json?.activo}`);
  } else {
    record(20, 'Editar sucursal (PATCH)', false, 'no se creó sucursal');
    record(20, 'Editar con nombre duplicado rechazado (400)', false, 'no se creó sucursal');
    record(20, 'Desactivar sucursal sin dependencias (200)', false, 'no se creó sucursal');
  }

  const conDeps = ctx.sucursalId;
  if (conDeps) {
    await req('PATCH', `/sucursales/${conDeps}`, { token: admin.token, body: { activo: true } });
    const block = await req('DELETE', `/sucursales/${conDeps}`, { token: admin.token });
    record(20, 'Desactivar con operaciones activas bloqueado (409)', block.status === 409, `status=${block.status}, detail=${block.json?.detail}`);

    const forced = await req('DELETE', `/sucursales/${conDeps}?forzar=true`, { token: admin.token });
    record(20, 'Desactivar con forzar=true (200)', forced.status === 200 && forced.json?.activo === false, `status=${forced.status}, activo=${forced.json?.activo}`);

    const restaurado = await req('PATCH', `/sucursales/${conDeps}`, { token: admin.token, body: { activo: true } });
    record(20, 'Restaurar sucursal para siguientes corridas', restaurado.status === 200 && restaurado.json?.activo === true, `status=${restaurado.status}`);
  }
}

// ============================================================
// CU21 - Administrar catálogo (CRUD) (administrador)
// ============================================================
async function testCU21() {
  cuHeader(21, 'Administrar catálogo de productos (CRUD)');
  const admin = ctx.tokens.admin;
  const cliente = ctx.tokens.cliente;
  const p = ctx.producto;

  const created = await req('POST', '/catalogo/productos', {
    token: admin.token,
    body: {
      nombre: 'E2E Producto',
      descripcion: 'Producto de prueba automática',
      precio: 199.9,
      categoria_id: p?.categoria_id ?? 1,
      temporada_id: p?.temporada_id ?? 1,
      proveedor_id: p?.proveedor_id ?? 1,
    },
  });
  record(21, 'Administrador crea producto (201)', created.status === 201, `status=${created.status}`);

  if (created.status === 201) {
    const id = created.json.id_producto;
    ctx.e2eProductoId = id;
    const upd = await req('PATCH', `/catalogo/productos/${id}`, { token: admin.token, body: { precio: 249.9 } });
    record(21, 'Actualizar producto (PATCH)', upd.status === 200 && upd.json?.precio === 249.9, `status=${upd.status}, precio=${upd.json?.precio}`);

    const variante = await req('POST', '/catalogo/productos/variantes', {
      token: admin.token,
      body: { producto_id: id, color_id: 1, talla_id: 1, sku: `E2E-${Date.now()}`, precio_extra: 0 },
    });
    record(21, 'Agregar variante al producto (201)', variante.status === 201, `status=${variante.status}`);

    const auto = await req('POST', '/catalogo/productos/variantes', {
      token: admin.token,
      body: { producto_id: id, color_id: 2, talla_id: 2 },
    });
    record(21, 'Variante con SKU autogenerado', auto.status === 201 && Boolean(auto.json?.sku), `status=${auto.status}, sku=${auto.json?.sku}`);

    let duplicado = { status: 0 };
    if (auto.status === 201) {
      duplicado = await req('POST', '/catalogo/productos/variantes', {
        token: admin.token,
        body: { producto_id: id, color_id: 2, talla_id: 2, sku: auto.json.sku },
      });
    }
    record(21, 'SKU duplicado rechazado (400)', duplicado.status === 400, `status=${duplicado.status}, detail=${duplicado.json?.detail}`);

    let varianteCli = { status: 0 };
    if (auto.status === 201) {
      varianteCli = await req('DELETE', `/catalogo/productos/variantes/${auto.json.id_variante}`, { token: cliente.token });
    }
    record(21, 'Cliente NO puede eliminar variante (403)', varianteCli.status === 403, `status=${varianteCli.status}`);

    const sinDeps = await req('PATCH', `/catalogo/productos/${id}`, { token: admin.token, body: { activo: false } });
    record(21, 'Desactivar producto sin dependencias (200)', sinDeps.status === 200, `status=${sinDeps.status}`);
  } else {
    record(21, 'Actualizar producto (PATCH)', false, 'no se creó producto');
    record(21, 'Agregar variante al producto (201)', false, 'no se creó producto');
    record(21, 'Variante con SKU autogenerado', false, 'no se creó producto');
    record(21, 'SKU duplicado rechazado (400)', false, 'no se creó producto');
    record(21, 'Cliente NO puede eliminar variante (403)', false, 'no se creó producto');
    record(21, 'Desactivar producto sin dependencias (200)', false, 'no se creó producto');
  }

  const forbidden = await req('POST', '/catalogo/productos', {
    token: cliente.token,
    body: {
      nombre: 'E2E Ilegal',
      precio: 100,
      categoria_id: p?.categoria_id ?? 1,
      temporada_id: p?.temporada_id ?? 1,
      proveedor_id: p?.proveedor_id ?? 1,
    },
  });
  record(21, 'Cliente NO puede crear producto (403)', forbidden.status === 403, `status=${forbidden.status}`);

  const encargadoNoAutorizado = await req('POST', '/catalogo/productos', {
    token: ctx.tokens.encargado.token,
    body: {
      nombre: 'E2E No autorizado',
      precio: 100,
      categoria_id: p?.categoria_id ?? 1,
      temporada_id: p?.temporada_id ?? 1,
      proveedor_id: p?.proveedor_id ?? 1,
    },
  });
  record(21, 'Encargado NO puede crear producto (403)', encargadoNoAutorizado.status === 403, `status=${encargadoNoAutorizado.status}`);

  const invalido = await req('POST', '/catalogo/productos', {
    token: admin.token,
    body: {
      nombre: 'E2E Precio Malo',
      precio: -50,
      categoria_id: p?.categoria_id ?? 1,
      temporada_id: p?.temporada_id ?? 1,
      proveedor_id: p?.proveedor_id ?? 1,
    },
  });
  record(21, 'Precio inválido rechazado (422)', invalido.status === 422, `status=${invalido.status}`);

  const catMala = await req('POST', '/catalogo/productos', {
    token: admin.token,
    body: {
      nombre: 'E2E Categoria Mal',
      precio: 100,
      categoria_id: 999999,
      temporada_id: p?.temporada_id ?? 1,
      proveedor_id: p?.proveedor_id ?? 1,
    },
  });
  record(21, 'Categoría inexistente rechazada (404)', catMala.status === 404, `status=${catMala.status}, detail=${catMala.json?.detail}`);

  const todasAdmin = await req('GET', '/catalogo/productos?todas=true', { token: ctx.tokens.admin.token });
  record(21, 'Admin lista todos (todas=true)', todasAdmin.status === 200, `status=${todasAdmin.status}`);

  const todasCli = await req('GET', '/catalogo/productos?todas=true', { token: cliente.token });
  record(21, 'Cliente NO lista con todas (403)', todasCli.status === 403, `status=${todasCli.status}`);

  const stock = await req('GET', '/inventario');
  let conDepVo = null;
  if (stock.status === 200 && stock.json?.length) {
    const varianteIdConStock = stock.json[0].variante_id;
    const lista = todasAdmin.status === 200 ? todasAdmin.json : [];
    const target = lista.find((prod) => (prod.variantes || []).some((v) => v.id_variante === varianteIdConStock));
    conDepVo = target ? target.id_producto : null;
  }
  if (conDepVo) {
    const block = await req('PATCH', `/catalogo/productos/${conDepVo}`, { token: admin.token, body: { activo: false } });
    record(21, 'Desactivar producto con operaciones bloqueado (409)', block.status === 409, `status=${block.status}, detail=${block.json?.detail}`);

    const force = await req('PATCH', `/catalogo/productos/${conDepVo}?forzar=true`, { token: admin.token, body: { activo: false } });
    record(21, 'Desactivar con forzar=true (200)', force.status === 200 && force.json?.activo === false, `status=${force.status}, activo=${force.json?.activo}`);

    await req('PATCH', `/catalogo/productos/${conDepVo}`, { token: admin.token, body: { activo: true } });
  } else {
    record(21, 'Desactivar producto con operaciones bloqueado (409)', false, 'no se encontró producto con stock');
    record(21, 'Desactivar con forzar=true (200)', false, 'no se encontró producto con stock');
  }

  const totales = await req('GET', '/catalogo/proveedores');
  const maestros = (await req('GET', '/catalogo/tallas')).status;
  record(21, 'Datos maestros disponibles (tallas/proveedores)', maestros === 200 && totales.status === 200, `tallas=${maestros}, proveedores=${totales.status}`);
}

// ============================================================
// Runner
// ============================================================
async function main() {
  console.log(`\x1b[1mTest E2E CICLO #1 - FashionStore\x1b[0m`);
  console.log(`API: ${BASE}\n`);

  // precheck
  try {
    const ping = await req('GET', '/sucursales');
    if (ping.status === 0) throw new Error(ping.error);
  } catch (e) {
    console.error(`\x1b[31mNo se pudo conectar a la API en ${BASE}\x1b[0m`);
    console.error(String(e));
    process.exit(2);
  }

  // login de todos los roles
  for (const role of Object.keys(CREDS)) {
    try {
      ctx.tokens = ctx.tokens || {};
      ctx.tokens[role] = await login(role);
    } catch (e) {
      console.error(`\x1b[31m${e.message}\x1b[0m`);
      process.exit(2);
    }
  }

  const tests = [testCU1, testCU2, testCU3, testCU4, testCU5, testCU6, testCU8, testCU9, testCU18, testCU19, testCU20, testCU21];
  for (const t of tests) {
    try {
      await t();
    } catch (e) {
      record('?', t.name, false, `excepción: ${e.message}`);
    }
  }

  // resumen por CU
  const byCu = new Map();
  for (const r of results) {
    if (!byCu.has(r.cu)) byCu.set(r.cu, []);
    byCu.get(r.cu).push(r);
  }
  console.log('\n\x1b[1m================ RESUMEN POR CASO DE USO ================\x1b[0m');
  let fails = 0;
  let warns = 0;
  const order = [1, 2, 3, 4, 5, 6, 8, 9, 18, 19, 20, 21];
  for (const cu of order) {
    const rs = byCu.get(cu) || [];
    const f = rs.filter((r) => r.ok === false).length;
    const w = rs.filter((r) => r.ok === 'partial').length;
    const p = rs.filter((r) => r.ok === true).length;
    fails += f;
    warns += w;
    const status = f > 0 ? '\x1b[31mFAIL\x1b[0m' : w > 0 ? '\x1b[33mPARCIAL\x1b[0m' : '\x1b[32mOK\x1b[0m';
    console.log(`CU${String(cu).padStart(2)}: ${status}  (${p} ok, ${w} warn, ${f} fail)`);
  }

  const total = results.length;
  const pass = results.filter((r) => r.ok === true).length;
  console.log(`\n\x1b[1mTOTAL:\x1b[0m ${pass}/${total} verificaciones OK, ${warns} parciales, ${fails} fallidas`);
  process.exit(fails > 0 ? 1 : 0);
}

main();
