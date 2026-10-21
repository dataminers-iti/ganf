import { escapeHtml } from '../../../shared/dom/dom.js';
import { capitalizar, formatearFecha, recortar } from '../../../shared/utils/format.js';
import { formatEstadoIncidencia } from '../utils/incidents.js';

function renderOpcionesTecnicos(incidencia, tecnicos) {
    return tecnicos
        .map(tecnico => `<option value="${tecnico.id}" ${String(tecnico.id) === String(incidencia.asignado_a) ? 'selected' : ''}>${escapeHtml(tecnico.nombre)}</option>`)
        .join('');
}

function renderAcciones(incidencia, { rol, tecnicos }) {
    if (!['admin', 'tecnico'].includes(rol)) return '';

    const selectorTecnico = rol === 'admin'
        ? `<label class="visually-hidden" for="tecnico-inc-${incidencia.id}">Asignar técnico</label><select id="tecnico-inc-${incidencia.id}" onchange="asignarTecnicoIncidencia(${Number(incidencia.id)}, this.value)"><option value="">Sin asignar</option>${renderOpcionesTecnicos(incidencia, tecnicos)}</select>`
        : '';

    return `<td>
        <div class="incidence-action-stack">
        ${selectorTecnico}
        <div class="incidence-action-controls"><select aria-label="Cambiar estado de ${escapeHtml(incidencia.titulo)}" onchange="actualizarIncidencia(${Number(incidencia.id)}, this.value)" style="width:auto;padding:5px;font-size:12px;">
            <option value="" disabled selected>Cambiar estado</option>
            <option value="abierta">Abierta</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelta">Resuelta</option>
            <option value="cerrada">Cerrada</option>
        </select><button type="button" class="btn-priority-inc" data-incidencia-id="${Number(incidencia.id)}" data-prioridad="${escapeHtml(incidencia.prioridad)}" onclick="abrirDialogoPrioridadDesdeBoton(this)">Cambiar prioridad</button><button type="button" class="btn-delete-inc" data-incidencia-id="${Number(incidencia.id)}" data-incidencia-titulo="${escapeHtml(incidencia.titulo)}" aria-label="Borrar incidencia: ${escapeHtml(incidencia.titulo)}" title="Borrar incidencia" onclick="abrirDialogoBorrarDesdeBoton(this)"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button></div>
        </div>
    </td>`;
}

export function renderTablaIncidencias(incidencias, opciones = {}) {
    return incidencias.map(incidencia => `
        <tr>
            <td>${escapeHtml(incidencia.id)}</td>
            <td>${escapeHtml(incidencia.titulo)}</td>
            <td>${escapeHtml(recortar(incidencia.descripcion))}</td>
            <td>${escapeHtml(incidencia.area) || '-'}</td>
            <td><span class="badge badge-${escapeHtml(incidencia.prioridad)}">${capitalizar(incidencia.prioridad)}</span></td>
            <td><span class="badge badge-${escapeHtml(incidencia.estado)}">${formatEstadoIncidencia(incidencia.estado)}</span></td>
            <td>${escapeHtml(incidencia.nombre_reportador) || '-'}</td>
            <td>${escapeHtml(incidencia.nombre_tecnico) || 'Sin asignar'}</td>
            <td>${formatearFecha(incidencia.fecha_creacion)}</td>
            ${renderAcciones(incidencia, opciones)}
        </tr>
    `).join('');
}
