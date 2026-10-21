import { ApiError } from '../../../shared/api/http.js';
import { limpiarCampo, mostrarError } from '../../../shared/dom/dom.js';
import { verificarSesion } from '../../auth/index.js';
import { listarTecnicos } from '../../user-admin/index.js';
import {
    actualizarEstadoIncidencia,
    asignarTecnicoIncidencia,
    cambiarPrioridadIncidencia,
    crearIncidencia,
    eliminarIncidencia,
    listarIncidencias,
} from '../services/incidents.service.js';
import { renderTablaIncidencias } from '../components/incidents-table.js';

let rolActual = '';
let tecnicos = [];
let incidenciaPrioridadActiva = null;
let incidenciaBorrarActiva = null;

function mensajeDeError(error, predeterminado) {
    return error instanceof ApiError ? error.message : predeterminado;
}

async function cargarIncidencias() {
    const tbody = document.getElementById('bodyIncidencias');
    if (!tbody) return;

    try {
        const incidencias = await listarIncidencias();
        tbody.innerHTML = incidencias.length
            ? renderTablaIncidencias(incidencias, { rol: rolActual, tecnicos })
            : '<tr><td colspan="10">No hay incidencias registradas</td></tr>';
    } catch {
        tbody.innerHTML = '<tr><td colspan="10">Error al cargar incidencias</td></tr>';
    }
}

async function guardarIncidencia() {
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcionIncidencia').value.trim();
    const area = document.getElementById('area').value.trim();
    const prioridad = document.getElementById('prioridadIncidencia').value;

    mostrarError('errorIncidencia', '');

    if (!titulo || !descripcion || !area) {
        mostrarError('errorIncidencia', 'Debe completar todos los campos.');
        return;
    }
    if (titulo.length < 5) {
        mostrarError('errorIncidencia', 'El título debe tener al menos 5 caracteres.');
        return;
    }
    if (descripcion.length < 10) {
        mostrarError('errorIncidencia', 'La descripción debe ser más detallada.');
        return;
    }

    try {
        await crearIncidencia({ titulo, descripcion, area, prioridad });
        document.getElementById('estadoIncidencia').textContent = 'Incidencia guardada correctamente.';
        limpiarCampo('titulo');
        limpiarCampo('descripcionIncidencia');
        limpiarCampo('area');
        await cargarIncidencias();
    } catch (error) {
        mostrarError('errorIncidencia', mensajeDeError(error, 'Error de conexión'));
    }
}

async function actualizarIncidencia(id, nuevoEstado) {
    try {
        await actualizarEstadoIncidencia({ id, estado: nuevoEstado });
        await cargarIncidencias();
    } catch (error) {
        mostrarError('errorIncidencia', mensajeDeError(error, 'Error de conexión'));
    }
}

async function asignarTecnico(id, tecnicoId) {
    try {
        await asignarTecnicoIncidencia({ id, tecnicoId });
        await cargarIncidencias();
    } catch (error) {
        mostrarError('errorIncidencia', mensajeDeError(error, 'No se pudo asignar el técnico.'));
    }
}

function abrirDialogoPrioridadDesdeBoton(boton) {
    incidenciaPrioridadActiva = Number(boton.dataset.incidenciaId);
    document.getElementById('nuevaPrioridadIncidencia').value = boton.dataset.prioridad;
    document.getElementById('errorPrioridadIncidencia').textContent = '';
    document.getElementById('dialogoPrioridadIncidencia').showModal();
}

async function guardarPrioridadIncidencia() {
    const prioridad = document.getElementById('nuevaPrioridadIncidencia').value;
    const boton = document.getElementById('guardarPrioridadIncidencia');
    boton.disabled = true;

    try {
        const respuesta = await cambiarPrioridadIncidencia({ id: incidenciaPrioridadActiva, prioridad });
        document.getElementById('dialogoPrioridadIncidencia').close();
        document.getElementById('estadoIncidencia').textContent = respuesta.message;
        await cargarIncidencias();
    } catch (error) {
        document.getElementById('errorPrioridadIncidencia').textContent = mensajeDeError(error, 'No se pudo cambiar la prioridad.');
    } finally {
        boton.disabled = false;
    }
}

function abrirDialogoBorrarDesdeBoton(boton) {
    incidenciaBorrarActiva = Number(boton.dataset.incidenciaId);
    const titulo = boton.dataset.incidenciaTitulo || 'esta incidencia';
    document.getElementById('mensajeConfirmarBorradoIncidencia').textContent = `¿Seguro que querés borrar la incidencia «${titulo}»? Esta acción no se puede deshacer.`;
    document.getElementById('errorBorrarIncidencia').textContent = '';
    document.getElementById('dialogoBorrarIncidencia').showModal();
    document.getElementById('cancelarBorradoIncidencia').focus();
}

async function confirmarBorradoIncidencia() {
    const boton = document.getElementById('confirmarBorradoIncidencia');
    boton.disabled = true;

    try {
        const respuesta = await eliminarIncidencia(incidenciaBorrarActiva);
        document.getElementById('dialogoBorrarIncidencia').close();
        document.getElementById('estadoIncidencia').textContent = respuesta.message;
        await cargarIncidencias();
    } catch (error) {
        document.getElementById('errorBorrarIncidencia').textContent = mensajeDeError(error, 'No se pudo borrar la incidencia.');
    } finally {
        boton.disabled = false;
    }
}

export function initIncidentsPage() {
    // Puente para los onclick inline del HTML y de las filas generadas.
    window.guardarIncidencia = guardarIncidencia;
    window.actualizarIncidencia = actualizarIncidencia;
    window.asignarTecnicoIncidencia = asignarTecnico;
    window.abrirDialogoPrioridadDesdeBoton = abrirDialogoPrioridadDesdeBoton;
    window.guardarPrioridadIncidencia = guardarPrioridadIncidencia;
    window.abrirDialogoBorrarDesdeBoton = abrirDialogoBorrarDesdeBoton;
    window.confirmarBorradoIncidencia = confirmarBorradoIncidencia;

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

        if (['admin', 'tecnico'].includes(rolActual)) {
            document.getElementById('colAccionesInc').style.display = '';
        }

        await cargarIncidencias();
    });
}
