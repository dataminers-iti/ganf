import { ApiError } from '../../../shared/api/http.js';
import { limpiarCampo, mostrarError } from '../../../shared/dom/dom.js';
import { confirmarAccionCentrada } from '../../../shared/ui/dialog.js';
import { verificarSesion } from '../../auth/index.js';
import { eliminarEquipo, guardarEquipo, listarEquipos } from '../services/inventory.service.js';
import { crearUbicacion, eliminarUbicacion as borrarUbicacion, listarUbicaciones } from '../services/locations.service.js';
import { renderTablaEquipos } from '../components/inventory-table.js';
import { renderOpcionesUbicaciones, renderTablaUbicaciones } from '../components/locations-table.js';

let esAdmin = false;
let inventarioActual = []; // Cache local del último listado, para poblar el form al editar.

function mensajeDeError(error, predeterminado) {
    return error instanceof ApiError ? error.message : predeterminado;
}

async function cargarUbicaciones() {
    const select = document.getElementById('ubicacion_id');
    if (!select) return;

    try {
        const ubicaciones = await listarUbicaciones();
        select.innerHTML = '<option value="">Seleccione una ubicación</option>' + renderOpcionesUbicaciones(ubicaciones);

        const tabla = document.getElementById('bodyUbicaciones');
        if (tabla) {
            tabla.innerHTML = ubicaciones.length
                ? renderTablaUbicaciones(ubicaciones)
                : '<tr><td colspan="6">No hay ubicaciones registradas.</td></tr>';
        }
    } catch {
        mostrarError('errorInventario', 'No se pudieron cargar las ubicaciones.');
    }
}

async function eliminarUbicacion(id, boton) {
    const confirmado = await confirmarAccionCentrada({
        titulo: 'Borrar ubicación',
        mensaje: `¿Seguro que querés borrar «${boton.dataset.nombre}»? Solo se puede borrar si no tiene equipos asignados.`,
        confirmar: 'Sí, borrar',
        peligro: true,
    });
    if (!confirmado) return;

    try {
        const respuesta = await borrarUbicacion(id);
        document.getElementById('estadoUbicacion').textContent = respuesta.message;
        await cargarUbicaciones();
    } catch (error) {
        mostrarError('errorUbicacion', mensajeDeError(error, 'No se pudo borrar la ubicación.'));
    }
}

async function guardarUbicacion() {
    mostrarError('errorUbicacion', '');

    try {
        const respuesta = await crearUbicacion({
            edificio: document.getElementById('edificioUbicacion').value.trim(),
            tipo: document.getElementById('tipoUbicacion').value,
            nombre: document.getElementById('nombreUbicacion').value.trim(),
            piso: document.getElementById('pisoUbicacion').value.trim(),
            referencia: document.getElementById('referenciaUbicacion').value.trim(),
        });

        document.getElementById('estadoUbicacion').textContent = respuesta.message;
        limpiarCampo('nombreUbicacion');
        limpiarCampo('pisoUbicacion');
        limpiarCampo('referenciaUbicacion');

        await cargarUbicaciones();
        document.getElementById('ubicacion_id').value = String(respuesta.data.id);
    } catch (error) {
        mostrarError('errorUbicacion', mensajeDeError(error, 'Error de conexión.'));
    }
}

async function cargarInventario() {
    const tbody = document.getElementById('bodyInventario');
    if (!tbody) return;

    try {
        const equipos = await listarEquipos();
        inventarioActual = equipos;
        tbody.innerHTML = equipos.length
            ? renderTablaEquipos(equipos, { esAdmin })
            : '<tr><td colspan="10">No hay equipos registrados</td></tr>';
    } catch {
        inventarioActual = [];
        tbody.innerHTML = '<tr><td colspan="10">Error al cargar inventario</td></tr>';
    }
}

function prepararEdicion(id) {
    const equipo = inventarioActual.find(item => Number(item.id) === Number(id));
    if (!equipo) return;

    document.getElementById('idEditando').value = equipo.id;
    document.getElementById('nombre').value = equipo.nombre || '';
    document.getElementById('tipo').value = equipo.tipo || '';
    document.getElementById('marca').value = equipo.marca || '';
    document.getElementById('modelo').value = equipo.modelo || '';
    document.getElementById('numero_serie').value = equipo.numero_serie || '';
    document.getElementById('estado').value = equipo.estado || 'activo';
    document.getElementById('ubicacion_id').value = equipo.ubicacion_id || '';
    document.getElementById('descripcion').value = equipo.descripcion || '';
    document.getElementById('cantidad').value = equipo.cantidad || 1;

    document.getElementById('tituloFormInventario').textContent = 'Editar Equipo';
    document.getElementById('btnGuardarInventario').textContent = 'Guardar cambios';
    document.getElementById('btnCancelarEdicion').style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
    document.getElementById('idEditando').value = '';
    ['nombre', 'marca', 'modelo', 'numero_serie', 'descripcion'].forEach(id => limpiarCampo(id));
    document.getElementById('ubicacion_id').selectedIndex = 0;
    document.getElementById('cantidad').value = '1';
    document.getElementById('tipo').selectedIndex = 0;
    document.getElementById('estado').selectedIndex = 0;

    document.getElementById('tituloFormInventario').textContent = 'Agregar Equipo';
    document.getElementById('btnGuardarInventario').textContent = 'Agregar equipo';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
}

async function guardarProducto() {
    const idEditando = document.getElementById('idEditando').value;
    const nombre = document.getElementById('nombre').value.trim();

    mostrarError('errorInventario', '');

    if (!nombre) {
        mostrarError('errorInventario', 'El nombre del equipo es obligatorio.');
        return;
    }

    const datos = {
        nombre,
        tipo: document.getElementById('tipo').value,
        marca: document.getElementById('marca').value.trim(),
        modelo: document.getElementById('modelo').value.trim(),
        numero_serie: document.getElementById('numero_serie').value.trim(),
        estado: document.getElementById('estado').value,
        ubicacion_id: document.getElementById('ubicacion_id').value,
        descripcion: document.getElementById('descripcion').value.trim(),
        cantidad: document.getElementById('cantidad').value || 1,
    };
    if (idEditando) datos.id = idEditando;

    try {
        await guardarEquipo(datos);
        document.getElementById('estadoInventario').textContent = idEditando
            ? 'Equipo actualizado correctamente.'
            : 'Equipo agregado correctamente.';
        cancelarEdicion();
        await cargarInventario();
    } catch (error) {
        mostrarError('errorInventario', mensajeDeError(error, 'Error de conexión'));
    }
}

async function eliminarProducto(id) {
    const equipo = inventarioActual.find(item => Number(item.id) === Number(id));
    const confirmado = await confirmarAccionCentrada({
        titulo: 'Eliminar equipo',
        mensaje: `¿Seguro que querés eliminar «${equipo?.nombre || 'este equipo'}»? Esta acción no se puede deshacer.`,
        confirmar: 'Sí, eliminar',
        peligro: true,
    });
    if (!confirmado) return;

    try {
        await eliminarEquipo(id);
        document.getElementById('estadoInventario').textContent = 'Equipo eliminado correctamente.';
        await cargarInventario();
    } catch (error) {
        mostrarError('errorInventario', mensajeDeError(error, 'Error de conexión'));
    }
}

export function initInventoryPage() {
    // Puente para los onclick inline del HTML y de las filas generadas.
    window.guardarProducto = guardarProducto;
    window.cancelarEdicion = cancelarEdicion;
    window.prepararEdicion = prepararEdicion;
    window.eliminarProducto = eliminarProducto;
    window.guardarUbicacion = guardarUbicacion;
    window.eliminarUbicacion = eliminarUbicacion;

    document.addEventListener('DOMContentLoaded', async () => {
        const usuario = await verificarSesion();
        if (!usuario) return;

        esAdmin = usuario.rol === 'admin';

        if (esAdmin) {
            document.getElementById('formInventario').style.display = 'flex';
            document.getElementById('colAcciones').style.display = '';
            document.getElementById('panelUbicaciones').style.display = 'flex';
            document.getElementById('listaUbicaciones').style.display = 'block';
        }

        await cargarUbicaciones();
        await cargarInventario();

        if (window.location.hash === '#ubicaciones' && esAdmin) {
            const panel = document.getElementById('panelUbicaciones');
            panel.open = true;
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}
