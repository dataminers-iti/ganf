import { api } from '../../../shared/api/http.js';

export function iniciarSesion({ correo, clave }) {
    return api.post('auth.php?accion=login', { correo, clave });
}

export function registrarCuenta({ nombre, correo, clave }) {
    return api.post('auth.php?accion=registro', { nombre, correo, clave });
}

export async function cerrarSesion() {
    try {
        await api.post('auth.php?accion=logout');
    } catch {
        // El logout local debe completarse aunque falle la red.
    }
}

export function consultarSesion() {
    return api.get('auth.php?accion=sesion');
}
