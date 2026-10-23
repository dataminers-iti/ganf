import { escapeHtml } from '../../../shared/dom/dom.js';
import { icono } from '../../../shared/ui/icons.js';
import { formatearFecha } from '../../../shared/utils/format.js';
import { verificarSesion } from '../../auth/index.js';
import { cargarResumen } from '../services/dashboard.service.js';
import { calcularEstadisticas, construirActividad, listarErrores } from '../utils/dashboard.js';

function actualizarUsuarioEnTopbar(usuario) {
    const nombreUsuario = document.querySelector('.topbar-user > span:first-child');
    if (nombreUsuario) {
        nombreUsuario.innerHTML = `${escapeHtml(usuario.nombre)} <small>${escapeHtml(usuario.rol)}</small>`;
    }

    const avatar = document.querySelector('.topbar-avatar');
    if (avatar) {
        avatar.textContent = (usuario.nombre || 'U')
            .split(/\s+/)
            .slice(0, 2)
            .map(nombre => nombre[0])
            .join('')
            .toUpperCase();
    }
}

function renderizarActividad(actividad) {
    const tbody = document.getElementById('actividadReciente');
    if (!tbody) return;

    tbody.innerHTML = actividad.length
        ? actividad.map(fila => `<tr><td>${escapeHtml(fila.detalle)}</td><td>${escapeHtml(fila.tipo)}</td><td><span class="badge badge-${escapeHtml(fila.estado)}">${escapeHtml(String(fila.estado || '').replace('_', ' '))}</span></td><td>${formatearFecha(fila.fecha, 'es-UY')}</td></tr>`).join('')
        : '<tr><td colspan="4" class="empty-note">No hay actividad registrada todavía.</td></tr>';
}

function renderizarUbicaciones(ubicaciones) {
    const contenedor = document.getElementById('dashboardUbicaciones');
    if (!contenedor) return;

    contenedor.innerHTML = ubicaciones.length
        ? ubicaciones.slice(0, 4).map(ubicacion => {
            const detalle = [ubicacion.edificio, ubicacion.tipo, ubicacion.piso, ubicacion.referencia].filter(Boolean).join(' · ');
            return `<div class="location-row"><span class="location-row-icon">${icono('ubicacion')}</span><span><strong>${escapeHtml(ubicacion.nombre)}</strong><small>${escapeHtml(detalle)}</small></span></div>`;
        }).join('')
        : '<p class="location-empty">Todavía no hay ubicaciones cargadas.</p>';
}

function renderizarEstadisticas(estadisticas) {
    const valores = {
        statIncidencias: estadisticas.incidenciasAbiertas,
        statSolicitudes: estadisticas.solicitudesPendientes,
        statEquipos: estadisticas.equipos,
        statPrestamos: estadisticas.prestamosActivos,
    };
    for (const [id, valor] of Object.entries(valores)) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    }
}

export function initDashboardPage() {
    document.addEventListener('DOMContentLoaded', async () => {
        const usuario = await verificarSesion();
        if (!usuario) return;

        const mensajeBienvenida = document.getElementById('mensajeBienvenida');
        if (mensajeBienvenida) {
            mensajeBienvenida.textContent = `Bienvenido, ${usuario.nombre}. Desde aquí podés acceder a las funciones de SGRSI.`;
        }
        actualizarUsuarioEnTopbar(usuario);

        if (usuario.rol === 'usuario') {
            document.querySelector('.quick-actions a[href="servicio.html"]')?.remove();
        }

        const datos = await cargarResumen();
        renderizarEstadisticas(calcularEstadisticas(datos));
        renderizarActividad(construirActividad(datos));
        renderizarUbicaciones(Array.isArray(datos.ubicaciones) ? datos.ubicaciones : []);

        const errorDashboard = document.getElementById('errorDashboard');
        if (errorDashboard) errorDashboard.textContent = listarErrores(datos).join(' ');
    });
}
