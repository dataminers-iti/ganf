// API pública de la feature user-admin.
// Otras features (incidents, service-requests) reutilizan listarTecnicos.

export { initUsersPage } from './views/users.view.js';
export {
    listarUsuarios,
    listarTecnicos,
    cambiarRolUsuario,
    cambiarActivoUsuario,
} from './services/users.service.js';
export { renderTablaUsuarios } from './components/users-table.js';
