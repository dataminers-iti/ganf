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
            ? '<span style="color:green;">Activo</span>'
            : '<span style="color:red;">Inactivo</span>';

        return `
            <tr>
                <td>${escapeHtml(usuario.id)}</td>
                <td>${escapeHtml(usuario.nombre || '-')}</td>
                <td>${escapeHtml(usuario.correo || '-')}</td>
                <td>${estado}</td>
                <td>${formatearFecha(usuario.fecha_creacion)}</td>
                <td><div class="incidence-action-controls">
                    <select onchange="cambiarRol(${Number(usuario.id)}, this.value)" style="width:auto;padding:5px;font-size:12px;">
                        ${opcionesRol}
                    </select>
                    <button onclick="toggleActivo(${Number(usuario.id)}, ${usuario.activo ? 0 : 1})"
                            style="background:${usuario.activo ? '#e74c3c' : '#27ae60'};width:auto;padding:5px 10px;font-size:12px;">
                        ${usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </div></td>
            </tr>
        `;
    }).join('');
}
