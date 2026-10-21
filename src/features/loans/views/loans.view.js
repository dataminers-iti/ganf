import { ApiError } from '../../../shared/api/http.js';
import { escapeHtml, mostrarError } from '../../../shared/dom/dom.js';
import { confirmarAccionCentrada } from '../../../shared/ui/dialog.js';
import { verificarSesion } from '../../auth/index.js';
import {
    actualizarEstadoPrestamo,
    crearPrestamo,
    eliminarPrestamo,
    listarEquiposDisponibles,
    listarPrestamos,
} from '../services/loans.service.js';
import { renderTablaPrestamos } from '../components/loans-table.js';

let rolActual = '';

function mensajeDeError(error, predeterminado) {
    return error instanceof ApiError ? error.message : predeterminado;
}

async function cargarEquiposPrestamo() {
    const select = document.getElementById('equipoPrestamo');
    if (!select) return;

    try {
        const equipos = await listarEquiposDisponibles();
        select.innerHTML = equipos.length
            ? '<option value="">Seleccione un equipo</option>' + equipos.map(equipo => {
                const serie = equipo.numero_serie ? ` · ${escapeHtml(equipo.numero_serie)}` : '';
                return `<option value="${Number(equipo.id)}" data-disponible="${Number(equipo.disponible)}">${escapeHtml(equipo.nombre)}${serie} · ${Number(equipo.disponible)} disponibles</option>`;
            }).join('')
            : '<option value="">No hay equipos disponibles</option>';

        select.onchange = () => {
            document.getElementById('cantidadPrestamo').max = select.selectedOptions[0]?.dataset.disponible || 1;
        };
    } catch (error) {
        select.innerHTML = `<option value="">${escapeHtml(error.message || 'No se pudo cargar el inventario')}</option>`;
    }
}

async function cargarPrestamos() {
    const tbody = document.getElementById('bodyPrestamos');
    if (!tbody) return;

    try {
        const prestamos = await listarPrestamos();
        tbody.innerHTML = prestamos.length
            ? renderTablaPrestamos(prestamos, { rol: rolActual })
            : '<tr><td colspan="7">Todavía no hay préstamos registrados.</td></tr>';
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message || 'No se pudieron cargar los préstamos.')}</td></tr>`;
    }
}

async function solicitarPrestamo() {
    mostrarError('errorPrestamo', '');
    document.getElementById('estadoPrestamo').textContent = '';

    try {
        const respuesta = await crearPrestamo({
            equipoId: document.getElementById('equipoPrestamo').value,
            motivo: document.getElementById('motivoPrestamo').value.trim(),
            cantidad: document.getElementById('cantidadPrestamo').value,
            fechaDevolucionPrevista: document.getElementById('fechaPrestamo').value,
        });

        document.getElementById('estadoPrestamo').textContent = respuesta.message;
        document.getElementById('motivoPrestamo').value = '';
        document.getElementById('fechaPrestamo').value = '';
        document.getElementById('cantidadPrestamo').value = '1';

        await cargarPrestamos();
        await cargarEquiposPrestamo();
    } catch (error) {
        mostrarError('errorPrestamo', mensajeDeError(error, 'Error de conexión.'));
    }
}

async function actualizarPrestamo(id, estado) {
    try {
        const respuesta = await actualizarEstadoPrestamo({ id, estado });
        document.getElementById('estadoPrestamo').textContent = respuesta.message;
        await cargarPrestamos();
        await cargarEquiposPrestamo();
    } catch (error) {
        mostrarError('errorPrestamo', mensajeDeError(error, 'No se pudo actualizar el préstamo.'));
    }
}

async function borrarPrestamo(id, boton) {
    const confirmado = await confirmarAccionCentrada({
        titulo: 'Borrar préstamo',
        mensaje: `¿Seguro que querés borrar el préstamo de «${boton.dataset.equipo}»? Esta acción no se puede deshacer.`,
        confirmar: 'Sí, borrar',
        peligro: true,
    });
    if (!confirmado) return;

    try {
        const respuesta = await eliminarPrestamo(id);
        document.getElementById('estadoPrestamo').textContent = respuesta.message;
        await cargarPrestamos();
        await cargarEquiposPrestamo();
    } catch (error) {
        mostrarError('errorPrestamo', mensajeDeError(error, 'No se pudo borrar el préstamo.'));
    }
}

export function initLoansPage() {
    // Puente para los onclick inline del HTML y de las filas generadas.
    window.solicitarPrestamo = solicitarPrestamo;
    window.actualizarPrestamo = actualizarPrestamo;
    window.borrarPrestamo = borrarPrestamo;

    document.addEventListener('DOMContentLoaded', async () => {
        const usuario = await verificarSesion();
        if (!usuario) return;

        rolActual = usuario.rol;
        document.getElementById('colAccionesPrestamo').style.display = ['admin', 'tecnico'].includes(rolActual) ? '' : 'none';

        await cargarEquiposPrestamo();
        await cargarPrestamos();
    });
}
