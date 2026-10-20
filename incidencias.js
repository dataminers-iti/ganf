// FUNCIONES DE INCIDENCIAS
let rolUsuarioInc = '';
let tecnicosDisponibles = [];

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
                        ${rolUsuarioInc === 'admin' ? `<label class="visually-hidden" for="tecnico-inc-${inc.id}">Asignar técnico</label><select id="tecnico-inc-${inc.id}" onchange="asignarTecnicoIncidencia(${inc.id}, this.value)"><option value="">Sin asignar</option>${tecnicosDisponibles.map(t => `<option value="${t.id}" ${String(t.id) === String(inc.asignado_a) ? 'selected' : ''}>${escapeHtml(t.nombre)}</option>`).join('')}</select>` : ''}
                        <select onchange="actualizarIncidencia(${inc.id}, this.value)" style="width:auto;padding:5px;font-size:12px;">
                            <option value="" disabled selected>Cambiar estado</option>
                            <option value="abierta">Abierta</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="resuelta">Resuelta</option>
                            <option value="cerrada">Cerrada</option>
                        </select>
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
