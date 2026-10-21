import { escapeHtml } from '../../../shared/dom/dom.js';
import { formatEstadoEquipo } from '../utils/inventory.js';

export function renderTablaEquipos(equipos, { esAdmin = false } = {}) {
    return equipos.map(equipo => `
        <tr>
            <td>${escapeHtml(equipo.id)}</td>
            <td>${escapeHtml(equipo.nombre)}</td>
            <td>${escapeHtml(equipo.tipo) || '-'}</td>
            <td>${escapeHtml(equipo.marca) || '-'}</td>
            <td>${escapeHtml(equipo.modelo) || '-'}</td>
            <td>${escapeHtml(equipo.numero_serie) || '-'}</td>
            <td><span class="badge badge-${escapeHtml(equipo.estado)}">${formatEstadoEquipo(equipo.estado)}</span></td>
            <td>${escapeHtml(equipo.ubicacion_nombre) || 'Sin ubicación'}</td>
            <td>${escapeHtml(equipo.cantidad)}</td>
            ${esAdmin ? `<td><div class="incidence-action-controls">
                <button onclick="prepararEdicion(${Number(equipo.id)})" style="background:#0095f6;width:auto;padding:5px 10px;font-size:12px;">Editar</button>
                <button type="button" class="btn-delete-inc" aria-label="Eliminar equipo: ${escapeHtml(equipo.nombre)}" onclick="eliminarProducto(${Number(equipo.id)})"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button>
            </div></td>` : ''}
        </tr>
    `).join('');
}
