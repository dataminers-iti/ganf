// FUNCIONES DE SERVICIO
let rolUsuarioSol = '';
let tecnicosServicio = [];
let solicitudActiva = null;

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await verificarSesion();
    if (!usuario) return;
    rolUsuarioSol = usuario.rol;
    if (rolUsuarioSol === 'admin') {
        const r = await fetch('api/usuarios.php?accion=tecnicos'); const d = await r.json();
        tecnicosServicio = d.data || [];
    }

    // Show form for admin and solicitante
    if (['admin', 'solicitante'].includes(rolUsuarioSol)) {
        document.getElementById('formSolicitud').style.display = 'flex';
    }

    // Admin and tecnico can manage
    if (['admin', 'tecnico'].includes(rolUsuarioSol)) {
        document.getElementById('colAccionesSol').style.display = '';
    }

    cargarSolicitudes();
});

async function cargarSolicitudes() {
    try {
        const resp = await fetch('api/solicitudes.php?accion=listar');
        const data = await resp.json();
        const tbody = document.getElementById('bodySolicitudes');

        if (data.status === 'exito' && data.data.length > 0) {
            tbody.innerHTML = data.data.map(sol => `
                <tr>
                    <td>${sol.id}</td>
                    <td>${escapeHtml(sol.tipo_servicio)}</td>
                    <td>${escapeHtml(sol.descripcion.substring(0, 50))}${sol.descripcion.length > 50 ? '...' : ''}</td>
                    <td><span class="badge badge-${sol.prioridad}">${sol.prioridad.charAt(0).toUpperCase() + sol.prioridad.slice(1)}</span></td>
                    <td><span class="badge badge-${sol.estado}">${formatEstadoSol(sol.estado)}</span></td>
                    <td>${escapeHtml(sol.nombre_solicitante) || '-'}</td>
                    <td>${escapeHtml(sol.nombre_tecnico) || 'Sin asignar'}</td>
                    <td>${new Date(sol.fecha_creacion).toLocaleDateString()}</td>
                    ${['admin', 'tecnico'].includes(rolUsuarioSol) ? `<td>
                        ${rolUsuarioSol === 'admin' ? `<label class="visually-hidden" for="tecnico-sol-${sol.id}">Asignar técnico</label><select id="tecnico-sol-${sol.id}" onchange="asignarTecnicoSolicitud(${sol.id}, this.value)"><option value="">Sin asignar</option>${tecnicosServicio.map(t => `<option value="${t.id}" ${String(t.id) === String(sol.tecnico_id) ? 'selected' : ''}>${escapeHtml(t.nombre)}</option>`).join('')}</select>` : ''}
                        <div class="incidence-action-controls"><select aria-label="Cambiar estado de solicitud ${sol.id}" onchange="actualizarSolicitud(${sol.id}, this.value)" style="width:auto;padding:5px;font-size:12px;">
                            <option value="" disabled selected>Cambiar estado</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="completada">Completada</option>
                            <option value="rechazada">Rechazada</option>
                        </select>
                            <button type="button" class="btn-priority-inc" data-solicitud-id="${sol.id}" data-prioridad="${sol.prioridad}" onclick="abrirPrioridadSolicitud(this)">Cambiar prioridad</button>
                            <button type="button" class="btn-delete-inc" aria-label="Borrar solicitud: ${escapeHtml(sol.tipo_servicio)}" onclick="borrarSolicitud(${sol.id}, this)" data-titulo="${escapeHtml(sol.tipo_servicio)}"><span aria-hidden="true">⌫</span></button>
                        </div>
                    </td>` : ''}
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="9">No hay solicitudes registradas</td></tr>';
        }
    } catch (err) {
        document.getElementById('bodySolicitudes').innerHTML = '<tr><td colspan="9">Error al cargar solicitudes</td></tr>';
    }
}

function formatEstadoSol(estado) {
    const map = { 'pendiente': 'Pendiente', 'en_proceso': 'En proceso', 'completada': 'Completada', 'rechazada': 'Rechazada' };
    return map[estado] || estado;
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
        const formData = new FormData();
        formData.append('tipo_servicio', tipo);
        formData.append('descripcion', descripcion);
        formData.append('prioridad', prioridad);

        const resp = await fetch('api/solicitudes.php?accion=crear', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();

        if (data.status === 'exito') {
            document.getElementById('estadoServicio').textContent = 'Solicitud enviada correctamente.';
            limpiarCampo('tipoServicio');
            limpiarCampo('descripcionServicio');
            document.getElementById('prioridad').selectedIndex = 0;
            cargarSolicitudes();
        } else {
            mostrarError('errorServicio', data.message || 'Error al enviar');
        }
    } catch (err) {
        mostrarError('errorServicio', 'Error de conexión');
    }
}

async function actualizarSolicitud(id, nuevoEstado) {
    try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('estado', nuevoEstado);

        const resp = await fetch('api/solicitudes.php?accion=actualizar', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();
        if (data.status === 'exito') {
            cargarSolicitudes();
        } else {
            mostrarError('errorServicio', data.message || 'Error al actualizar');
        }
    } catch (err) {
        mostrarError('errorServicio', 'Error de conexión');
    }
}

async function asignarTecnicoSolicitud(id, tecnicoId) {
    const f = new FormData(); f.append('id', id); f.append('tecnico_id', tecnicoId);
    try { const r=await fetch('api/solicitudes.php?accion=asignar',{method:'POST',body:f}); const d=await r.json(); if(d.status!=='exito') throw new Error(d.message); cargarSolicitudes(); }
    catch(e) { mostrarError('errorServicio', e.message || 'No se pudo asignar el técnico.'); }
}

async function abrirPrioridadSolicitud(boton) {
    solicitudActiva = Number(boton.dataset.solicitudId);
    const valor = await elegirPrioridadCentrada({titulo:'Cambiar prioridad', prioridad:boton.dataset.prioridad});
    if (!valor) return;
    const f = new FormData(); f.append('id', solicitudActiva); f.append('prioridad', valor);
    try { const r=await fetch('api/solicitudes.php?accion=cambiar_prioridad',{method:'POST',body:f}); const d=await r.json(); if(!r.ok || d.status!=='exito') throw new Error(d.message); cargarSolicitudes(); }
    catch(e) { mostrarError('errorServicio',e.message || 'No se pudo cambiar la prioridad.'); }
}

async function borrarSolicitud(id, boton) {
    const ok = await confirmarAccionCentrada({titulo:'Borrar solicitud', mensaje:`¿Seguro que querés borrar la solicitud «${boton.dataset.titulo}»? Esta acción no se puede deshacer.`, confirmar:'Sí, borrar', peligro:true});
    if (!ok) return;
    const f=new FormData(); f.append('id',id);
    try { const r=await fetch('api/solicitudes.php?accion=eliminar',{method:'POST',body:f}); const d=await r.json(); if(!r.ok || d.status!=='exito') throw new Error(d.message); document.getElementById('estadoServicio').textContent=d.message; cargarSolicitudes(); }
    catch(e) { mostrarError('errorServicio',e.message || 'No se pudo borrar la solicitud.'); }
}
