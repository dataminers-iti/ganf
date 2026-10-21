/**
 * @typedef {'activo' | 'en_reparacion' | 'de_baja'} EstadoEquipo
 * @typedef {'laboratorio' | 'salon' | 'administracion' | 'otro'} TipoUbicacion
 *
 * @typedef {Object} Equipo
 * @property {number} id
 * @property {string} nombre
 * @property {string} [tipo]
 * @property {string} [marca]
 * @property {string} [modelo]
 * @property {string} [numero_serie]
 * @property {EstadoEquipo} estado
 * @property {number|string} [ubicacion_id]
 * @property {string} [ubicacion_nombre]
 * @property {string} [descripcion]
 * @property {number} cantidad
 *
 * @typedef {Object} Ubicacion
 * @property {number} id
 * @property {string} edificio
 * @property {TipoUbicacion} tipo
 * @property {string} nombre
 * @property {string} [piso]
 * @property {string} [referencia]
 */

export {};
