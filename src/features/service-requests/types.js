/**
 * @typedef {'alta' | 'media' | 'baja'} Prioridad
 * @typedef {'pendiente' | 'en_proceso' | 'completada' | 'rechazada'} EstadoSolicitud
 *
 * @typedef {Object} Solicitud
 * @property {number} id
 * @property {string} tipo_servicio
 * @property {string} descripcion
 * @property {Prioridad} prioridad
 * @property {EstadoSolicitud} estado
 * @property {string} nombre_solicitante
 * @property {string} [nombre_tecnico]
 * @property {number|string} [tecnico_id]
 * @property {string} fecha_creacion
 */

export {};
