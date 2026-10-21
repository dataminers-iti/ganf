/**
 * @typedef {'usuario' | 'solicitante' | 'tecnico' | 'admin'} RolUsuario
 *
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre
 * @property {string} correo
 * @property {RolUsuario} rol
 * @property {boolean|number} activo
 * @property {string} fecha_creacion
 *
 * @typedef {Pick<Usuario, 'id' | 'nombre'>} Tecnico
 */

export {};
