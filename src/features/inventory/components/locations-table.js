import { escapeHtml } from '../../../shared/dom/dom.js';

function etiquetaUbicacion(ubicacion) {
    return [ubicacion.edificio, ubicacion.tipo, ubicacion.nombre, ubicacion.piso, ubicacion.referencia]
        .filter(Boolean)
        .join(' · ');
}

export function renderOpcionesUbicaciones(ubicaciones) {
    return ubicaciones
        .map(ubicacion => `<option value="${Number(ubicacion.id)}">${escapeHtml(etiquetaUbicacion(ubicacion))}</option>`)
        .join('');
}

export function renderTablaUbicaciones(ubicaciones) {
    return ubicaciones.map(ubicacion => `
        <tr>
            <td>${escapeHtml(ubicacion.edificio)}</td>
            <td>${escapeHtml(ubicacion.tipo)}</td>
            <td>${escapeHtml(ubicacion.nombre)}</td>
            <td>${escapeHtml(ubicacion.piso || '—')}</td>
            <td>${escapeHtml(ubicacion.referencia || '—')}</td>
            <td><button type="button" class="btn-delete-inc" aria-label="Borrar ubicación ${escapeHtml(ubicacion.nombre)}" onclick="eliminarUbicacion(${Number(ubicacion.id)}, this)" data-nombre="${escapeHtml(ubicacion.nombre)}"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button></td>
        </tr>
    `).join('');
}
