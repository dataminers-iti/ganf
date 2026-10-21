// Rutas de la aplicación (entradas HTML: index en la raíz y el resto en sites/).

import { RUTAS } from '../shared/config/paths.js';

export { RUTAS };

export function irAPagina(ruta) {
    window.location.href = ruta;
}

export function mostrarLogin() { irAPagina(RUTAS.login); }
export function mostrarRegistro() { irAPagina(RUTAS.registro); }
export function mostrarSistema() { irAPagina(RUTAS.sistema); }
export function mostrarInventario() { irAPagina(RUTAS.inventario); }
export function mostrarIncidencias() { irAPagina(RUTAS.incidencias); }
export function mostrarServicio() { irAPagina(RUTAS.servicio); }
export function mostrarPrincipal() { irAPagina(RUTAS.panel); }
export function mostrarAdminUsuarios() { irAPagina(RUTAS.adminUsuarios); }
export function mostrarPrestamos() { irAPagina(RUTAS.prestamos); }

// Puente para los onclick inline del HTML.
export function bindNavigationGlobals() {
    window.mostrarLogin = mostrarLogin;
    window.mostrarRegistro = mostrarRegistro;
    window.mostrarSistema = mostrarSistema;
    window.mostrarInventario = mostrarInventario;
    window.mostrarIncidencias = mostrarIncidencias;
    window.mostrarServicio = mostrarServicio;
    window.mostrarPrincipal = mostrarPrincipal;
    window.mostrarAdminUsuarios = mostrarAdminUsuarios;
    window.mostrarPrestamos = mostrarPrestamos;
}
