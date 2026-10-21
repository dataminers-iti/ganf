import { ApiError } from '../../../shared/api/http.js';
import { limpiarCampo, mostrarError } from '../../../shared/dom/dom.js';
import { confirmarAccionCentrada, elegirPrioridadCentrada } from '../../../shared/ui/dialog.js';
import { verificarSesion } from '../../auth/index.js';
import { listarTecnicos } from '../../user-admin/index.js';
import {
    actualizarEstadoSolicitud,
    asignarTecnicoSolicitud,
    cambiarPrioridadSolicitud,
    crearSolicitud,
    eliminarSolicitud,
    listarSolicitudes,
} from '../services/service-requests.service.js';
import { renderTablaSolicitudes } from '../components/service-requests-table.js';

let rolActual = '';
let tecnicos = [];
let solicitudActiva = null;

function mensajeDeError(error, predeterminado) {
    return error instanceof ApiError ? error.message : predeterminado;
}

async function cargarSolicitudes() {
    const tbody = document.getElementById('bodySolicitudes');
    if (!tbody) return;

    try {
        const solicitudes = await listarSolicitudes();
        tbody.innerHTML = solicitudes.length
            ? renderTablaSolicitudes(solicitudes, { rol: rolActual, tecnicos })
            : '<tr><td colspan="9">No hay solicitudes registradas</td></tr>';
    } catch {
        tbody.innerHTML = '<tr><td colspan="9">Error al cargar solicitudes</td></tr>';
    }
}

async function enviarSolicitud() {
    const tipo = document.getElementById('tipoServicio').value.trim();
    const descripcion = document.getElementById('descripcionServicio').value.trim();
    const prioridad = document.getElementById('prioridad').value;

    mostrarError('errorServicio', '');

    if (!tipo || !descripcion || !prioridad) {
        mostrarError('errorServicio', 'Debe completar todos los campos.');
        return;
    }
    if (tipo.length < 3) {
        mostrarError('errorServicio', 'El tipo de servicio debe tener al menos 3 caracteres.');
        return;
    }
    if (descripcion.length < 10) {
        mostrarError('errorServicio', 'La descripción debe ser más detallada.');
        return;
    }

    try {
        await crearSolicitud({ tipoServicio: tipo, descripcion, prioridad });
        document.getElementById('estadoServicio').textContent = 'Solicitud enviada correctamente.';
        limpiarCampo('tipoServicio');
        limpiarCampo('descripcionServicio');
        document.getElementById('prioridad').selectedIndex = 0;
        await cargarSolicitudes();
    } catch (error) {
        mostrarError('errorServicio', mensajeDeError(error, 'Error de conexión'));
    }
}

async function actualizarSolicitud(id, nuevoEstado) {
    try {
        await actualizarEstadoSolicitud({ id, estado: nuevoEstado });
        await cargarSolicitudes();
    } catch (error) {
        mostrarError('errorServicio', mensajeDeError(error, 'Error de conexión'));
    }
}

async function asignarTecnico(id, tecnicoId) {
    try {
        await asignarTecnicoSolicitud({ id, tecnicoId });
        await cargarSolicitudes();
    } catch (error) {
        mostrarError('errorServicio', mensajeDeError(error, 'No se pudo asignar el técnico.'));
    }
}

async function abrirPrioridadSolicitud(boton) {
    solicitudActiva = Number(boton.dataset.solicitudId);
    const prioridad = await elegirPrioridadCentrada({
        titulo: 'Cambiar prioridad',
        prioridad: boton.dataset.prioridad,
    });
    if (!prioridad) return;

    try {
        await cambiarPrioridadSolicitud({ id: solicitudActiva, prioridad });
        await cargarSolicitudes();
    } catch (error) {
        mostrarError('errorServicio', mensajeDeError(error, 'No se pudo cambiar la prioridad.'));
    }
}

async function borrarSolicitud(id, boton) {
    const confirmado = await confirmarAccionCentrada({
        titulo: 'Borrar solicitud',
        mensaje: `¿Seguro que querés borrar la solicitud «${boton.dataset.titulo}»? Esta acción no se puede deshacer.`,
        confirmar: 'Sí, borrar',
        peligro: true,
    });
    if (!confirmado) return;

    try {
        const respuesta = await eliminarSolicitud(id);
        document.getElementById('estadoServicio').textContent = respuesta.message;
        await cargarSolicitudes();
    } catch (error) {
        mostrarError('errorServicio', mensajeDeError(error, 'No se pudo borrar la solicitud.'));
    }
}

export function initServiceRequestsPage() {
    // Puente para los onclick inline del HTML y de las filas generadas.
    window.enviarSolicitud = enviarSolicitud;
    window.actualizarSolicitud = actualizarSolicitud;
    window.asignarTecnicoSolicitud = asignarTecnico;
    window.abrirPrioridadSolicitud = abrirPrioridadSolicitud;
    window.borrarSolicitud = borrarSolicitud;

    document.addEventListener('DOMContentLoaded', async () => {
        const usuario = await verificarSesion();
        if (!usuario) return;

        rolActual = usuario.rol;
        if (rolActual === 'admin') {
            try {
                tecnicos = await listarTecnicos();
            } catch {
                tecnicos = [];
            }
        }

        if (['admin', 'solicitante'].includes(rolActual)) {
            document.getElementById('formSolicitud').style.display = 'flex';
        }
        if (['admin', 'tecnico'].includes(rolActual)) {
            document.getElementById('colAccionesSol').style.display = '';
        }

        await cargarSolicitudes();
    });
}
