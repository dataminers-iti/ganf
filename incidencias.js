// FUNCIONES DE INCIDENCIAS
let rolUsuarioInc = '';
let tecnicosDisponibles = [];
let incidenciaPrioridadActiva = null;
let incidenciaBorrarActiva = null;

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await verificarSesion();
    if (!usuario) return;
    rolUsuarioInc = usuario.rol;
    if (rolUsuarioInc === 'admin') {
        const r = await fetch('api/usuarios.php?accion=tecnicos'); const d = await r.json();
        tecnicosDisponibles = d.data || [];
    }

    // Admin and tecnico can manage incidents
    if (['admin', 'tecnico'].includes(rolUsuarioInc)) {
        document.getElementById('colAccionesInc').style.display = '';
    }

    cargarIncidencias();
});

async function cargarIncidencias() {
    try {
        const resp = await fetch('api/incidencias.php?accion=listar');
        const data = await resp.json();
        const tbody = document.getElementById('bodyIncidencias');

        if (data.status === 'exito' && data.data.length > 0) {
            tbody.innerHTML = data.data.map(inc => `
                <tr>
                    <td>${inc.id}</td>
                    <td>${escapeHtml(inc.titulo)}</td>
                    <td>${escapeHtml(inc.descripcion.substring(0, 50))}${inc.descripcion.length > 50 ? '...' : ''}</td>
                    <td>${escapeHtml(inc.area) || '-'}</td>
                    <td><span class="badge badge-${inc.prioridad}">${inc.prioridad.charAt(0).toUpperCase() + inc.prioridad.slice(1)}</span></td>
                    <td><span class="badge badge-${inc.estado}">${formatEstadoInc(inc.estado)}</span></td>
                    <td>${escapeHtml(inc.nombre_reportador) || '-'}</td>
                    <td>${escapeHtml(inc.nombre_tecnico) || 'Sin asignar'}</td>
                    <td>${new Date(inc.fecha_creacion).toLocaleDateString()}</td>
                    ${['admin', 'tecnico'].includes(rolUsuarioInc) ? `<td>
                        <div class="incidence-action-stack">
                        ${rolUsuarioInc === 'admin' ? `<label class="visually-hidden" for="tecnico-inc-${inc.id}">Asignar técnico</label><select id="tecnico-inc-${inc.id}" onchange="asignarTecnicoIncidencia(${inc.id}, this.value)"><option value="">Sin asignar</option>${tecnicosDisponibles.map(t => `<option value="${t.id}" ${String(t.id) === String(inc.asignado_a) ? 'selected' : ''}>${escapeHtml(t.nombre)}</option>`).join('')}</select>` : ''}
                        <div class="incidence-action-controls"><select aria-label="Cambiar estado de ${escapeHtml(inc.titulo)}" onchange="actualizarIncidencia(${Number(inc.id)}, this.value)" style="width:auto;padding:5px;font-size:12px;">
                            <option value="" disabled selected>Cambiar estado</option>
                            <option value="abierta">Abierta</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="resuelta">Resuelta</option>
                            <option value="cerrada">Cerrada</option>
                        </select><button type="button" class="btn-priority-inc" data-incidencia-id="${Number(inc.id)}" data-prioridad="${escapeHtml(inc.prioridad)}" onclick="abrirDialogoPrioridadDesdeBoton(this)">Cambiar prioridad</button><button type="button" class="btn-delete-inc" data-incidencia-id="${Number(inc.id)}" data-incidencia-titulo="${escapeHtml(inc.titulo)}" aria-label="Borrar incidencia: ${escapeHtml(inc.titulo)}" title="Borrar incidencia" onclick="abrirDialogoBorrarDesdeBoton(this)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
                        </div>
                    </td>` : ''}
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="10">No hay incidencias registradas</td></tr>';
        }
    } catch (err) {
        document.getElementById('bodyIncidencias').innerHTML = '<tr><td colspan="10">Error al cargar incidencias</td></tr>';
    }
}

function formatEstadoInc(estado) {
    const map = { 'abierta': 'Abierta', 'en_proceso': 'En proceso', 'resuelta': 'Resuelta', 'cerrada': 'Cerrada' };
    return map[estado] || estado;
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
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        formData.append('area', area);
        formData.append('prioridad', prioridad);

        const resp = await fetch('api/incidencias.php?accion=crear', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();

        if (data.status === 'exito') {
            document.getElementById('estadoIncidencia').textContent = 'Incidencia guardada correctamente.';
            limpiarCampo('titulo');
            limpiarCampo('descripcionIncidencia');
            limpiarCampo('area');
            cargarIncidencias();
        } else {
            mostrarError('errorIncidencia', data.message || 'Error al guardar');
        }
    } catch (err) {
        mostrarError('errorIncidencia', 'Error de conexión');
    }
}

async function actualizarIncidencia(id, nuevoEstado) {
    try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('estado', nuevoEstado);

        const resp = await fetch('api/incidencias.php?accion=actualizar', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();
        if (data.status === 'exito') {
            cargarIncidencias();
        } else {
            mostrarError('errorIncidencia', data.message || 'Error al actualizar');
        }
    } catch (err) {
        mostrarError('errorIncidencia', 'Error de conexión');
    }
}

async function asignarTecnicoIncidencia(id, tecnicoId) {
    const f = new FormData(); f.append('id', id); f.append('tecnico_id', tecnicoId);
    try { const r=await fetch('api/incidencias.php?accion=asignar',{method:'POST',body:f}); const d=await r.json(); if(d.status!=='exito') throw new Error(d.message); cargarIncidencias(); }
    catch(e) { mostrarError('errorIncidencia', e.message || 'No se pudo asignar el técnico.'); }
}

function abrirDialogoPrioridadDesdeBoton(boton) {
    incidenciaPrioridadActiva = Number(boton.dataset.incidenciaId);
    document.getElementById('nuevaPrioridadIncidencia').value = boton.dataset.prioridad;
    document.getElementById('errorPrioridadIncidencia').textContent = '';
    document.getElementById('dialogoPrioridadIncidencia').showModal();
}

async function guardarPrioridadIncidencia() {
    const prioridad = document.getElementById('nuevaPrioridadIncidencia').value;
    const formData = new FormData();
    formData.append('id', incidenciaPrioridadActiva);
    formData.append('prioridad', prioridad);
    const boton = document.getElementById('guardarPrioridadIncidencia');
    boton.disabled = true;
    try {
        const resp = await fetch('api/incidencias.php?accion=cambiar_prioridad', { method: 'POST', body: formData });
        const data = await resp.json();
        if (!resp.ok || data.status !== 'exito') throw new Error(data.message || 'No se pudo cambiar la prioridad.');
        document.getElementById('dialogoPrioridadIncidencia').close();
        document.getElementById('estadoIncidencia').textContent = data.message;
        await cargarIncidencias();
    } catch (error) {
        document.getElementById('errorPrioridadIncidencia').textContent = error.message || 'No se pudo cambiar la prioridad.';
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
    const formData = new FormData();
    formData.append('id', incidenciaBorrarActiva);
    const boton = document.getElementById('confirmarBorradoIncidencia');
    boton.disabled = true;
    try {
        const resp = await fetch('api/incidencias.php?accion=eliminar', { method: 'POST', body: formData });
        const data = await resp.json();
        if (!resp.ok || data.status !== 'exito') throw new Error(data.message || 'No se pudo borrar la incidencia.');
        document.getElementById('dialogoBorrarIncidencia').close();
        document.getElementById('estadoIncidencia').textContent = data.message;
        await cargarIncidencias();
    } catch (error) {
        document.getElementById('errorBorrarIncidencia').textContent = error.message || 'No se pudo borrar la incidencia.';
    } finally {
        boton.disabled = false;
    }
}
