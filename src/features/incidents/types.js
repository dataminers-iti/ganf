/**
 * @typedef {'alta' | 'media' | 'baja'} Prioridad
 * @typedef {'abierta' | 'en_proceso' | 'resuelta' | 'cerrada'} EstadoIncidencia
 *
 * @typedef {Object} Incidencia
 * @property {number} id
 * @property {string} titulo
 * @property {string} descripcion
 * @property {string} area
 * @property {Prioridad} prioridad
 * @property {EstadoIncidencia} estado
 * @property {string} nombre_reportador
 * @property {string} [nombre_tecnico]
 * @property {number|string} [asignado_a]
 * @property {string} fecha_creacion
 */

export {};
