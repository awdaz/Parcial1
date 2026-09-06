-- ============================================================
-- SCRIPT 3: 30 CONSULTAS DE PRUEBA - FASHIONSTORE
-- Sistemas II - Bolivia
-- Consultas de los módulos: Catálogo, Inventario, Reservas, Usuarios
-- ============================================================

\c fashionstore;

\echo '============================================================'
\echo ' MÓDULO: CATÁLOGO DE PRODUCTOS (CU4, CU5, CU21)'
\echo '============================================================'

-- ------------------------------------------------------------
-- 1. Listar todos los productos activos con su categoría y precio
-- ------------------------------------------------------------
SELECT p.id_producto, p.nombre, c.nombre AS categoria, p.precio
FROM productos p
JOIN categorias c ON c.id_categoria = p.categoria_id
WHERE p.activo = TRUE
ORDER BY p.nombre;

-- ------------------------------------------------------------
-- 2. Productos filtrados por categoría (Ej: Pantalones)
-- ------------------------------------------------------------
SELECT p.nombre, p.precio, c.nombre AS categoria
FROM productos p
JOIN categorias c ON c.id_categoria = p.categoria_id
WHERE c.nombre = 'Pantalones';

-- ------------------------------------------------------------
-- 3. Productos de una talla específica (Ej: M)
-- ------------------------------------------------------------
SELECT DISTINCT p.nombre, t.nombre AS talla
FROM productos p
JOIN producto_variantes pv ON pv.producto_id = p.id_producto
JOIN tallas t ON t.id_talla = pv.talla_id
WHERE t.nombre = 'M';

-- ------------------------------------------------------------
-- 4. Productos de un color específico (Ej: Negro)
-- ------------------------------------------------------------
SELECT DISTINCT p.nombre, co.nombre AS color
FROM productos p
JOIN producto_variantes pv ON pv.producto_id = p.id_producto
JOIN colores co ON co.id_color = pv.color_id
WHERE co.nombre = 'Negro';

-- ------------------------------------------------------------
-- 5. Productos por temporada (Ej: Primavera - Verano 2026)
-- ------------------------------------------------------------
SELECT p.nombre, t.nombre AS temporada, p.precio
FROM productos p
JOIN temporadas t ON t.id_temporada = p.temporada_id
WHERE t.nombre = 'Primavera - Verano 2026';

-- ------------------------------------------------------------
-- 6. Productos de una colección promocional (Temporada escolar)
-- ------------------------------------------------------------
SELECT p.nombre, col.nombre AS coleccion, col.es_promocional
FROM productos p
JOIN colecciones col ON col.id_coleccion = p.coleccion_id
WHERE col.es_promocional = TRUE;

-- ------------------------------------------------------------
-- 7. Filtro combinado: categoría + temporada + rango de precio
-- ------------------------------------------------------------
SELECT p.nombre, c.nombre AS categoria, t.nombre AS temporada, p.precio
FROM productos p
JOIN categorias c ON c.id_categoria = p.categoria_id
JOIN temporadas t ON t.id_temporada = p.temporada_id
WHERE c.nombre = 'Camisetas'
  AND t.nombre = 'Primavera - Verano 2026'
  AND p.precio BETWEEN 40 AND 100;

-- ------------------------------------------------------------
-- 8. Búsqueda de productos por texto (nombre o descripción)
-- ------------------------------------------------------------
SELECT nombre, precio
FROM productos
WHERE nombre ILIKE '%vestido%' OR descripcion ILIKE '%vestido%';

-- ------------------------------------------------------------
-- 9. Productos ordenados por precio (más caros primero)
-- ------------------------------------------------------------
SELECT nombre, precio
FROM productos
ORDER BY precio DESC;

-- ------------------------------------------------------------
-- 10. Productos más económicos (menores a 100 Bs)
-- ------------------------------------------------------------
SELECT nombre, precio
FROM productos
WHERE precio < 100
ORDER BY precio;

-- ------------------------------------------------------------
-- 11. Cantidad de variantes (talla x color) por producto
-- ------------------------------------------------------------
SELECT p.nombre, COUNT(pv.id_variante) AS num_variantes
FROM productos p
LEFT JOIN producto_variantes pv ON pv.producto_id = p.id_producto
GROUP BY p.nombre
ORDER BY num_variantes DESC;

\echo ''
\echo '============================================================'
\echo ' MÓDULO: INVENTARIO Y EXISTENCIAS (CU6, RF08, RF21)'
\echo '============================================================'

-- ------------------------------------------------------------
-- 12. Disponibilidad por sucursal usando la función creada (RF08)
-- ------------------------------------------------------------
SELECT * FROM fn_consultar_disponibilidad(1);  -- Variante 1 (Camiseta Negra M)

-- ------------------------------------------------------------
-- 13. Productos disponibles en la sucursal 2 (Santa Cruz Ventura)
-- ------------------------------------------------------------
SELECT p.nombre, pv.sku, s.nombre AS sucursal, i.cantidad_disponible
FROM inventario i
JOIN producto_variantes pv ON pv.id_variante = i.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
JOIN sucursales s ON s.id_sucursal = i.sucursal_id
WHERE i.sucursal_id = 2 AND i.cantidad_disponible > 0
ORDER BY p.nombre;

-- ------------------------------------------------------------
-- 14. Productos agotados en alguna sucursal
-- ------------------------------------------------------------
SELECT p.nombre, pv.sku, s.nombre AS sucursal
FROM inventario i
JOIN producto_variantes pv ON pv.id_variante = i.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
JOIN sucursales s ON s.id_sucursal = i.sucursal_id
WHERE i.cantidad_disponible = 0 AND i.cantidad_reservada = 0;

-- ------------------------------------------------------------
-- 15. Productos con stock por debajo del mínimo (alerta reposición)
-- ------------------------------------------------------------
SELECT p.nombre, pv.sku, s.nombre AS sucursal, i.cantidad_disponible, i.stock_minimo
FROM inventario i
JOIN producto_variantes pv ON pv.id_variante = i.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
JOIN sucursales s ON s.id_sucursal = i.sucursal_id
WHERE i.cantidad_disponible <= i.stock_minimo
ORDER BY i.cantidad_disponible;

-- ------------------------------------------------------------
-- 16. Stock global consolidado por producto (todas las sucursales)
-- ------------------------------------------------------------
SELECT p.nombre, SUM(i.cantidad_disponible) AS total_disponible,
       SUM(i.cantidad_reservada) AS total_reservada,
       SUM(i.cantidad_recibida) AS total_por_ingresar
FROM inventario i
JOIN producto_variantes pv ON pv.id_variante = i.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
GROUP BY p.nombre
ORDER BY total_disponible DESC;

-- ------------------------------------------------------------
-- 17. Variantes próximas a ingresar (cantidad_recibida > 0)
-- ------------------------------------------------------------
SELECT p.nombre, pv.sku, s.nombre AS sucursal, i.cantidad_recibida
FROM inventario i
JOIN producto_variantes pv ON pv.id_variante = i.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
JOIN sucursales s ON s.id_sucursal = i.sucursal_id
WHERE i.cantidad_recibida > 0;

-- ------------------------------------------------------------
-- 18. Historial de movimientos de inventario (los mas recientes)
-- ------------------------------------------------------------
SELECT m.id_movimiento, p.nombre AS producto, pv.sku, s.nombre AS sucursal,
       m.tipo_movimiento, m.cantidad, m.fecha_movimiento, m.observacion
FROM movimientos_inventario m
JOIN producto_variantes pv ON pv.id_variante = m.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
JOIN sucursales s ON s.id_sucursal = m.sucursal_id
ORDER BY m.fecha_movimiento DESC
LIMIT 10;

-- ------------------------------------------------------------
-- 19. Totales de stock por sucursal
-- ------------------------------------------------------------
SELECT s.nombre AS sucursal, c.nombre AS ciudad,
       SUM(i.cantidad_disponible) AS unidades_disponibles,
       COUNT(DISTINCT i.variante_id) AS variantes_distintas
FROM inventario i
JOIN sucursales s ON s.id_sucursal = i.sucursal_id
JOIN ciudades c ON c.id_ciudad = s.ciudad_id
GROUP BY s.nombre, c.nombre
ORDER BY unidades_disponibles DESC;

-- ------------------------------------------------------------
-- 20. Movimientos de tipo 'reserva' registrados automáticamente
-- ------------------------------------------------------------
SELECT m.id_movimiento, p.nombre, m.cantidad, m.fecha_movimiento
FROM movimientos_inventario m
JOIN producto_variantes pv ON pv.id_variante = m.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
WHERE m.tipo_movimiento = 'reserva';

\echo ''
\echo '============================================================'
\echo ' MÓDULO: RESERVAS (CU8, CU9, CU18)'
\echo '============================================================'

-- ------------------------------------------------------------
-- 21. Reservas de un cliente específico (Laura Vargas, id 6)
-- ------------------------------------------------------------
SELECT r.id_reserva, s.nombre AS sucursal, r.fecha_reserva, r.hora_atencion, r.estado
FROM reservas r
JOIN sucursales s ON s.id_sucursal = r.sucursal_id
JOIN usuarios u ON u.id_usuario = r.usuario_id
WHERE u.email = 'laura.vargas@gmail.com'
ORDER BY r.fecha_reserva;

-- ------------------------------------------------------------
-- 22. Reservas pendientes en la sucursal 1 (para el encargado)
-- ------------------------------------------------------------
SELECT r.id_reserva, u.nombre AS cliente, r.fecha_reserva, r.hora_atencion
FROM reservas r
JOIN usuarios u ON u.id_usuario = r.usuario_id
WHERE r.sucursal_id = 1 AND r.estado = 'pendiente'
ORDER BY r.fecha_reserva, r.hora_atencion;

-- ------------------------------------------------------------
-- 23. Reservas con su detalle completo (ítems)
-- ------------------------------------------------------------
SELECT r.id_reserva, u.nombre AS cliente, p.nombre AS producto,
       pv.sku, ri.cantidad, r.estado
FROM reservas r
JOIN reserva_items ri ON ri.reserva_id = r.id_reserva
JOIN producto_variantes pv ON pv.id_variante = ri.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
JOIN usuarios u ON u.id_usuario = r.usuario_id
ORDER BY r.id_reserva;

-- ------------------------------------------------------------
-- 24. Sucursales con más reservas
-- ------------------------------------------------------------
SELECT s.nombre AS sucursal, c.nombre AS ciudad, COUNT(r.id_reserva) AS total_reservas
FROM reservas r
JOIN sucursales s ON s.id_sucursal = r.sucursal_id
JOIN ciudades c ON c.id_ciudad = s.ciudad_id
GROUP BY s.nombre, c.nombre
ORDER BY total_reservas DESC;

-- ------------------------------------------------------------
-- 25. Productos más reservados (top prendas)
-- ------------------------------------------------------------
SELECT p.nombre, SUM(ri.cantidad) AS total_reservado
FROM reserva_items ri
JOIN producto_variantes pv ON pv.id_variante = ri.variante_id
JOIN productos p ON p.id_producto = pv.producto_id
GROUP BY p.nombre
ORDER BY total_reservado DESC;

-- ------------------------------------------------------------
-- 26. Reservas próximas (esta semana)
-- ------------------------------------------------------------
SELECT r.id_reserva, u.nombre AS cliente, s.nombre AS sucursal,
       r.fecha_reserva, r.hora_atencion, r.estado
FROM reservas r
JOIN usuarios u ON u.id_usuario = r.usuario_id
JOIN sucursales s ON s.id_sucursal = r.sucursal_id
WHERE r.fecha_reserva BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days');

-- ------------------------------------------------------------
-- 27. Reservas canceladas o completadas (historial)
-- ------------------------------------------------------------
SELECT r.id_reserva, u.nombre AS cliente, r.estado, r.fecha_creacion
FROM reservas r
JOIN usuarios u ON u.id_usuario = r.usuario_id
WHERE r.estado IN ('cancelada', 'completada');

\echo ''
\echo '============================================================'
\echo ' MÓDULO: USUARIOS Y ROLES (CU1, CU2, CU3, CU19)'
\echo '============================================================'

-- ------------------------------------------------------------
-- 28. Usuarios por rol
-- ------------------------------------------------------------
SELECT rol, COUNT(*) AS cantidad, STRING_AGG(nombre, ', ') AS nombres
FROM usuarios
GROUP BY rol
ORDER BY cantidad DESC;

-- ------------------------------------------------------------
-- 29. Empleados por sucursal
-- ------------------------------------------------------------
SELECT s.nombre AS sucursal, u.nombre AS empleado, u.rol
FROM usuarios u
JOIN sucursales s ON s.id_sucursal = u.sucursal_id
WHERE u.rol IN ('encargado', 'cajero')
ORDER BY s.nombre, u.rol;

-- ------------------------------------------------------------
-- 30. RESUMEN EJECUTIVO (dashboard - CU16)
-- Total de productos, sucursales, stock y reservas
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM productos)                AS total_productos,
  (SELECT COUNT(*) FROM producto_variantes)       AS total_variantes,
  (SELECT COUNT(*) FROM sucursales)               AS total_sucursales,
  (SELECT COUNT(*) FROM reservas)                 AS total_reservas,
  (SELECT SUM(cantidad_disponible) FROM inventario) AS stock_total_unidades,
  (SELECT COUNT(*) FROM reservas WHERE estado = 'pendiente') AS reservas_pendientes;
