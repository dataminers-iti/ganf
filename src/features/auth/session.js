import { consultarSesion, cerrarSesion } from './services/auth.service.js';
import { RUTAS } from '../../shared/config/paths.js';

const CLAVE_USUARIO = 'usuario';

export function getUsuarioActual() {
    try {
        const guardado = sessionStorage.getItem(CLAVE_USUARIO);
        return guardado ? JSON.parse(guardado) : null;
    } catch {
        return null;
    }
}

export function guardarUsuario(usuario) {
    try {
        sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    } catch {
        // Sin sessionStorage la app sigue funcionando, pero no recuerda al usuario.
    }
}

export function limpiarSesion() {
    try {
        sessionStorage.removeItem(CLAVE_USUARIO);
    } catch {
        // Ignorar.
    }
}

/**
 * Verifica la sesión contra el servidor. Si no hay sesión, redirige al login.
 */
export async function verificarSesion() {
    try {
        const respuesta = await consultarSesion();
        if (respuesta?.data) {
            guardarUsuario(respuesta.data);
            return respuesta.data;
        }
    } catch {
        // Sin sesión activa.
    }

    window.location.href = RUTAS.login;
    return null;
}

export function tieneRol(rolesPermitidos = []) {
    const usuario = getUsuarioActual();
    return Boolean(usuario && rolesPermitidos.includes(usuario.rol));
}

export async function logout() {
    await cerrarSesion();
    limpiarSesion();
    window.location.href = RUTAS.login;
}
