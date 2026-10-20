CREATE DATABASE IF NOT EXISTS sgrsi_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE sgrsi_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL,
    clave VARCHAR(255) NOT NULL, -- hash generado con password_hash()
    nombre VARCHAR(100),
    rol ENUM('admin','solicitante','tecnico','usuario') DEFAULT 'usuario',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    marca VARCHAR(50),
    modelo VARCHAR(50),
    numero_serie VARCHAR(100),
    estado ENUM('activo','en_reparacion','de_baja') DEFAULT 'activo',
    ubicacion_id INT NULL,
    descripcion TEXT,
    cantidad INT DEFAULT 1,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
);

CREATE TABLE IF NOT EXISTS incidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    area VARCHAR(100),
    equipo_id INT NULL,
    estado ENUM('abierta','en_proceso','resuelta','cerrada') DEFAULT 'abierta',
    prioridad ENUM('alta','media','baja') DEFAULT 'media',
    reportado_por INT NOT NULL,
    asignado_a INT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME,
    FOREIGN KEY (reportado_por) REFERENCES usuarios(id),
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id),
    FOREIGN KEY (equipo_id) REFERENCES inventario(id)
);

CREATE TABLE IF NOT EXISTS solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_servicio VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad ENUM('alta','media','baja') DEFAULT 'media',
    estado ENUM('pendiente','en_proceso','completada','rechazada') DEFAULT 'pendiente',
    solicitante_id INT NOT NULL,
    tecnico_id INT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_completada DATETIME,
    FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
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

-- ============================================================
-- Usuario admin por defecto
-- Correo: admin@sgrsi.com
-- Clave:  admin123
-- (hash bcrypt generado con password_hash() de PHP — cambiarla
--  después del primer login en un entorno real)
-- ============================================================
INSERT INTO usuarios (correo, clave, nombre, rol, activo)
VALUES (
    'admin@sgrsi.com',
    '$2y$10$gjrNnrsoAEMS.XNDXpFxxekhnR37KpqDbvg8lCJO54kYxRyCs0Wna',
    'Administrador',
    'admin',
    1
)
ON DUPLICATE KEY UPDATE correo = correo;
