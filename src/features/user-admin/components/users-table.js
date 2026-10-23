import { escapeHtml } from '../../../shared/dom/dom.js';
import { formatearFecha } from '../../../shared/utils/format.js';

const ROLES = [
    ['usuario', 'Usuario'],
    ['solicitante', 'Solicitante'],
    ['tecnico', 'Técnico'],
    ['admin', 'Admin'],
];

export function renderTablaUsuarios(usuarios) {
    return usuarios.map(usuario => {
        const opcionesRol = ROLES.map(([valor, etiqueta]) => `<option value="${valor}" ${usuario.rol === valor ? 'selected' : ''}>${etiqueta}</option>`).join('');
        const estado = usuario.activo
            ? '<span class="badge badge-activo">Activo</span>'
            : '<span class="badge badge-inactivo">Inactivo</span>';

        return `
            <tr>
                <td>${escapeHtml(usuario.id)}</td>
                <td>${escapeHtml(usuario.nombre || '-')}</td>
                <td>${escapeHtml(usuario.correo || '-')}</td>
                <td>${estado}</td>
                <td>${formatearFecha(usuario.fecha_creacion)}</td>
                <td><div class="incidence-action-controls">
                    <select onchange="cambiarRol(${Number(usuario.id)}, this.value)">
                        ${opcionesRol}
                    </select>
                    <button type="button" class="btn-tabla${usuario.activo ? ' btn-tabla-peligro' : ''}" onclick="toggleActivo(${Number(usuario.id)}, ${usuario.activo ? 0 : 1})">
                        ${usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </div></td>
            </tr>
        `;
    }).join('');
}
