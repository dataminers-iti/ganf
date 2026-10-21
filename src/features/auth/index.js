// API pública de la feature auth.

import { login } from './views/login.view.js';
import { registro } from './views/register.view.js';
import { logout, getUsuarioActual, verificarSesion, tieneRol } from './session.js';

export { login, registro, logout, getUsuarioActual, verificarSesion, tieneRol };
export { guardarUsuario, limpiarSesion } from './session.js';

// Puente para los onclick inline del HTML.
export function bindAuthGlobals() {
    window.login = login;
    window.registro = registro;
    window.logout = logout;
}
