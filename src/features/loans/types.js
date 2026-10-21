/**
 * @typedef {'solicitado' | 'aprobado' | 'rechazado' | 'entregado' | 'devuelto'} EstadoPrestamo
 *
 * @typedef {Object} Prestamo
 * @property {number} id
 * @property {string} nombre_equipo
 * @property {string} [numero_serie]
 * @property {string} nombre_usuario
 * @property {number} cantidad
 * @property {string} fecha_solicitud
 * @property {string} [fecha_devolucion_prevista]
 * @property {EstadoPrestamo} estado
 *
 * @typedef {Object} EquipoDisponible
 * @property {number} id
 * @property {string} nombre
 * @property {string} [numero_serie]
 * @property {number} disponible
 */

export {};
