import { escapeHtml } from '../../../shared/dom/dom.js';
import { icono } from '../../../shared/ui/icons.js';
import { capitalizar, formatearFecha, recortar } from '../../../shared/utils/format.js';
import { formatEstadoSolicitud } from '../utils/service-requests.js';

function renderOpcionesTecnicos(solicitud, tecnicos) {
    return tecnicos
        .map(tecnico => `<option value="${tecnico.id}" ${String(tecnico.id) === String(solicitud.tecnico_id) ? 'selected' : ''}>${escapeHtml(tecnico.nombre)}</option>`)
        .join('');
}

function renderAcciones(solicitud, { rol, tecnicos }) {
    if (!['admin', 'tecnico'].includes(rol)) return '';

    const selectorTecnico = rol === 'admin'
        ? `<label class="visually-hidden" for="tecnico-sol-${solicitud.id}">Asignar técnico</label><select id="tecnico-sol-${solicitud.id}" onchange="asignarTecnicoSolicitud(${Number(solicitud.id)}, this.value)"><option value="">Sin asignar</option>${renderOpcionesTecnicos(solicitud, tecnicos)}</select>`
        : '';

    return `<td>
        ${selectorTecnico}
        <div class="incidence-action-controls"><select aria-label="Cambiar estado de solicitud ${escapeHtml(solicitud.id)}" onchange="actualizarSolicitud(${Number(solicitud.id)}, this.value)">
            <option value="" disabled selected>Cambiar estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="completada">Completada</option>
            <option value="rechazada">Rechazada</option>
        </select>
            <button type="button" class="btn-priority-inc" data-solicitud-id="${Number(solicitud.id)}" data-prioridad="${escapeHtml(solicitud.prioridad)}" onclick="abrirPrioridadSolicitud(this)">Cambiar prioridad</button>
            <button type="button" class="btn-delete-inc" aria-label="Borrar solicitud: ${escapeHtml(solicitud.tipo_servicio)}" onclick="borrarSolicitud(${Number(solicitud.id)}, this)" data-titulo="${escapeHtml(solicitud.tipo_servicio)}">${icono('papelera')}</button>
        </div>
    </td>`;
}

export function renderTablaSolicitudes(solicitudes, opciones = {}) {
    return solicitudes.map(solicitud => `
        <tr>
            <td>${escapeHtml(solicitud.id)}</td>
            <td>${escapeHtml(solicitud.tipo_servicio)}</td>
            <td>${escapeHtml(recortar(solicitud.descripcion))}</td>
            <td><span class="badge badge-${escapeHtml(solicitud.prioridad)}">${capitalizar(solicitud.prioridad)}</span></td>
            <td><span class="badge badge-${escapeHtml(solicitud.estado)}">${formatEstadoSolicitud(solicitud.estado)}</span></td>
            <td>${escapeHtml(solicitud.nombre_solicitante) || '-'}</td>
            <td>${escapeHtml(solicitud.nombre_tecnico) || 'Sin asignar'}</td>
            <td>${formatearFecha(solicitud.fecha_creacion)}</td>
            ${renderAcciones(solicitud, opciones)}
        </tr>
    `).join('');
}
