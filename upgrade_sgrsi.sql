-- Actualiza la base existente sgrsi_db. Puede volver a ejecutarse.
-- Conserva la columna inventario.ubicacion (texto anterior) para no borrar datos.
USE sgrsi_db;

CREATE TABLE IF NOT EXISTS ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('laboratorio','salon','administracion','otro') NOT NULL DEFAULT 'otro',
    edificio VARCHAR(100) NOT NULL DEFAULT 'ITI',
    piso VARCHAR(30) NULL,
    referencia VARCHAR(100) NULL,
    activa TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY uq_ubicacion (edificio, tipo, nombre, piso, referencia)
);

CREATE TABLE IF NOT EXISTS prestamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    equipo_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    motivo VARCHAR(200) NOT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME NULL,
    fecha_devolucion_prevista DATE NULL,
    fecha_devolucion DATETIME NULL,
    estado ENUM('solicitado','aprobado','entregado','devuelto','rechazado') NOT NULL DEFAULT 'solicitado',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (equipo_id) REFERENCES inventario(id),
    INDEX idx_prestamos_equipo_estado (equipo_id, estado),
    INDEX idx_prestamos_usuario (usuario_id)
);

SET @tiene_ubicacion_id = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventario' AND COLUMN_NAME = 'ubicacion_id'
);
SET @sql_agregar_ubicacion_id = IF(@tiene_ubicacion_id = 0,
    'ALTER TABLE inventario ADD COLUMN ubicacion_id INT NULL', 'SELECT 1');
PREPARE stmt_ubicacion_id FROM @sql_agregar_ubicacion_id;
EXECUTE stmt_ubicacion_id;
DEALLOCATE PREPARE stmt_ubicacion_id;

SET @tiene_fk_ubicacion = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'inventario' AND CONSTRAINT_NAME = 'fk_inventario_ubicacion'
);
SET @sql_fk_ubicacion = IF(@tiene_fk_ubicacion = 0,
    'ALTER TABLE inventario ADD CONSTRAINT fk_inventario_ubicacion FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)', 'SELECT 1');
PREPARE stmt_fk_ubicacion FROM @sql_fk_ubicacion;
EXECUTE stmt_fk_ubicacion;
DEALLOCATE PREPARE stmt_fk_ubicacion;

-- Migra cada ubicación anterior de texto a un registro; luego relaciona los equipos.
INSERT INTO ubicaciones (nombre, tipo, edificio)
SELECT DISTINCT TRIM(i.ubicacion), 'otro', 'ITI'
FROM inventario i
LEFT JOIN ubicaciones u ON u.nombre = TRIM(i.ubicacion) AND u.tipo = 'otro' AND u.edificio = 'ITI'
WHERE i.ubicacion IS NOT NULL AND TRIM(i.ubicacion) <> '' AND u.id IS NULL;
UPDATE inventario i
JOIN ubicaciones u ON u.nombre = TRIM(i.ubicacion) AND u.tipo = 'otro' AND u.edificio = 'ITI'
SET i.ubicacion_id = u.id
WHERE i.ubicacion IS NOT NULL AND TRIM(i.ubicacion) <> '';
