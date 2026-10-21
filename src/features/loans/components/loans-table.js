import { escapeHtml } from '../../../shared/dom/dom.js';
import { formatearFecha } from '../../../shared/utils/format.js';
import { accionesDisponibles } from '../utils/loans.js';

function renderAcciones(prestamo, rol) {
    const botones = accionesDisponibles(prestamo, rol)
        .map(([estado, etiqueta]) => `<button type="button" class="btn-secundario" onclick="actualizarPrestamo(${Number(prestamo.id)},'${estado}')">${etiqueta}</button>`)
        .join('');

    const borrar = `<button type="button" class="btn-delete-inc" aria-label="Borrar préstamo" onclick="borrarPrestamo(${Number(prestamo.id)}, this)" data-equipo="${escapeHtml(prestamo.nombre_equipo)}"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button>`;

    return `<td>${botones}${borrar}</td>`;
}

export function renderTablaPrestamos(prestamos, { rol } = {}) {
    const puedeGestionar = ['admin', 'tecnico'].includes(rol);

    return prestamos.map(prestamo => `
        <tr>
            <td>${escapeHtml(prestamo.nombre_equipo)} (${escapeHtml(prestamo.cantidad)})</td>
            <td>${escapeHtml(prestamo.numero_serie) || '—'}</td>
            <td>${escapeHtml(prestamo.nombre_usuario)}</td>
            <td>${formatearFecha(prestamo.fecha_solicitud)}</td>
            <td>${escapeHtml(prestamo.fecha_devolucion_prevista || '—')}</td>
            <td><span class="badge badge-${escapeHtml(prestamo.estado)}">${escapeHtml(prestamo.estado)}</span></td>
            ${puedeGestionar ? renderAcciones(prestamo, rol) : ''}
        </tr>
    `).join('');
}
