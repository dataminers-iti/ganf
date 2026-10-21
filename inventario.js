// FUNCIONES DE INVENTARIO
let esAdmin = false;
let inventarioActual = []; // cache local del último listado, para poblar el form al editar

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
    cargarInventario();
    if (location.hash === '#ubicaciones' && esAdmin) {
        const panel = document.getElementById('panelUbicaciones');
        panel.open = true;
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

async function cargarUbicaciones() {
    const select = document.getElementById('ubicacion_id');
    try {
        const resp = await fetch('api/inventario.php?accion=ubicaciones');
        const data = await resp.json();
        if (data.status !== 'exito') throw new Error();
        select.innerHTML = '<option value="">Seleccione una ubicación</option>' + data.data.map(u =>
            `<option value="${u.id}">${escapeHtml([u.edificio,u.tipo,u.nombre,u.piso,u.referencia].filter(Boolean).join(' · '))}</option>`
        ).join('');
        const tabla = document.getElementById('bodyUbicaciones');
        if (tabla) tabla.innerHTML = data.data.length ? data.data.map(u => `<tr><td>${escapeHtml(u.edificio)}</td><td>${escapeHtml(u.tipo)}</td><td>${escapeHtml(u.nombre)}</td><td>${escapeHtml(u.piso || '—')}</td><td>${escapeHtml(u.referencia || '—')}</td><td><button type="button" class="btn-delete-inc" aria-label="Borrar ubicación ${escapeHtml(u.nombre)}" onclick="eliminarUbicacion(${Number(u.id)}, this)" data-nombre="${escapeHtml(u.nombre)}"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button></td></tr>`).join('') : '<tr><td colspan="6">No hay ubicaciones registradas.</td></tr>';
    } catch (_) { mostrarError('errorInventario', 'No se pudieron cargar las ubicaciones.'); }
}

async function eliminarUbicacion(id, boton) {
    const ok=await confirmarAccionCentrada({titulo:'Borrar ubicación',mensaje:`¿Seguro que querés borrar «${boton.dataset.nombre}»? Solo se puede borrar si no tiene equipos asignados.`,confirmar:'Sí, borrar',peligro:true});
    if(!ok)return;
    const f=new FormData();f.append('id',id);
    try{const r=await fetch('api/inventario.php?accion=eliminar_ubicacion',{method:'POST',body:f});const d=await r.json();if(!r.ok||d.status!=='exito')throw new Error(d.message);document.getElementById('estadoUbicacion').textContent=d.message;await cargarUbicaciones();}
    catch(e){mostrarError('errorUbicacion',e.message||'No se pudo borrar la ubicación.');}
}

async function guardarUbicacion() {
    mostrarError('errorUbicacion', '');
    const form = new FormData();
    form.append('edificio', document.getElementById('edificioUbicacion').value.trim());
    form.append('tipo', document.getElementById('tipoUbicacion').value);
    form.append('nombre', document.getElementById('nombreUbicacion').value.trim());
    form.append('piso', document.getElementById('pisoUbicacion').value.trim());
    form.append('referencia', document.getElementById('referenciaUbicacion').value.trim());
    try {
        const resp = await fetch('api/inventario.php?accion=crear_ubicacion', {method:'POST', body:form});
        const data = await resp.json();
        if (data.status !== 'exito') throw new Error(data.message || 'No se pudo guardar la ubicación.');
        document.getElementById('estadoUbicacion').textContent = data.message;
        document.getElementById('nombreUbicacion').value = '';
        document.getElementById('pisoUbicacion').value = '';
        document.getElementById('referenciaUbicacion').value = '';
        await cargarUbicaciones();
        document.getElementById('ubicacion_id').value = String(data.data.id);
    } catch (error) { mostrarError('errorUbicacion', error.message || 'Error de conexión.'); }
}

async function cargarInventario() {
    try {
        const resp = await fetch('api/inventario.php?accion=listar');
        const data = await resp.json();
        const tbody = document.getElementById('bodyInventario');

        if (data.status === 'exito' && data.data.length > 0) {
            inventarioActual = data.data;
            tbody.innerHTML = data.data.map(item => `
                <tr>
                    <td>${item.id}</td>
                    <td>${escapeHtml(item.nombre)}</td>
                    <td>${escapeHtml(item.tipo) || '-'}</td>
                    <td>${escapeHtml(item.marca) || '-'}</td>
                    <td>${escapeHtml(item.modelo) || '-'}</td>
                    <td>${escapeHtml(item.numero_serie) || '-'}</td>
                    <td><span class="badge badge-${item.estado}">${formatEstado(item.estado)}</span></td>
                    <td>${escapeHtml(item.ubicacion_nombre) || 'Sin ubicación'}</td>
                    <td>${item.cantidad}</td>
                    ${esAdmin ? `<td><div class="incidence-action-controls">
                        <button onclick="prepararEdicion(${item.id})" style="background:#0095f6;width:auto;padding:5px 10px;font-size:12px;">Editar</button>
                        <button type="button" class="btn-delete-inc" aria-label="Eliminar equipo: ${escapeHtml(item.nombre)}" onclick="eliminarProducto(${item.id})"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button>
                    </td>` : ''}
                </tr>
            `).join('');
        } else {
            inventarioActual = [];
            tbody.innerHTML = '<tr><td colspan="10">No hay equipos registrados</td></tr>';
        }
    } catch (err) {
        document.getElementById('bodyInventario').innerHTML = '<tr><td colspan="10">Error al cargar inventario</td></tr>';
    }
}

function formatEstado(estado) {
    const map = { 'activo': 'Activo', 'en_reparacion': 'En reparación', 'de_baja': 'De baja' };
    return map[estado] || estado;
}

function prepararEdicion(id) {
    const item = inventarioActual.find(i => i.id === id);
    if (!item) return;

    document.getElementById('idEditando').value = item.id;
    document.getElementById('nombre').value = item.nombre || '';
    document.getElementById('tipo').value = item.tipo || '';
    document.getElementById('marca').value = item.marca || '';
    document.getElementById('modelo').value = item.modelo || '';
    document.getElementById('numero_serie').value = item.numero_serie || '';
    document.getElementById('estado').value = item.estado || 'activo';
    document.getElementById('ubicacion_id').value = item.ubicacion_id || '';
    document.getElementById('descripcion').value = item.descripcion || '';
    document.getElementById('cantidad').value = item.cantidad || 1;

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
    const tipo = document.getElementById('tipo').value;
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const numero_serie = document.getElementById('numero_serie').value.trim();
    const estado = document.getElementById('estado').value;
    const ubicacion_id = document.getElementById('ubicacion_id').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const cantidad = document.getElementById('cantidad').value;

    mostrarError('errorInventario', '');

    if (!nombre) {
        mostrarError('errorInventario', 'El nombre del equipo es obligatorio.');
        return;
    }

    try {
        const formData = new FormData();
        if (idEditando) formData.append('id', idEditando);
        formData.append('nombre', nombre);
        formData.append('tipo', tipo);
        formData.append('marca', marca);
        formData.append('modelo', modelo);
        formData.append('numero_serie', numero_serie);
        formData.append('estado', estado);
        formData.append('ubicacion_id', ubicacion_id);
        formData.append('descripcion', descripcion);
        formData.append('cantidad', cantidad || 1);

        const accion = idEditando ? 'editar' : 'agregar';
        const resp = await fetch(`api/inventario.php?accion=${accion}`, {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();

        if (data.status === 'exito') {
            document.getElementById('estadoInventario').textContent = idEditando ? 'Equipo actualizado correctamente.' : 'Equipo agregado correctamente.';
            cancelarEdicion();
            cargarInventario();
        } else {
            mostrarError('errorInventario', data.message || 'Error al guardar equipo');
        }
    } catch (err) {
        mostrarError('errorInventario', 'Error de conexión');
    }
}

async function eliminarProducto(id) {
    const item = inventarioActual.find(equipo => Number(equipo.id) === Number(id));
    const confirmar = await confirmarAccionCentrada({
        titulo: 'Eliminar equipo',
        mensaje: `¿Seguro que querés eliminar «${item?.nombre || 'este equipo'}»? Esta acción no se puede deshacer.`,
        confirmar: 'Sí, eliminar',
        peligro: true
    });
    if (!confirmar) return;

    try {
        const formData = new FormData();
        formData.append('id', id);
        const resp = await fetch('api/inventario.php?accion=eliminar', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();
        if (data.status === 'exito') {
            document.getElementById('estadoInventario').textContent = 'Equipo eliminado correctamente.';
            cargarInventario();
        } else {
            mostrarError('errorInventario', data.message || 'Error al eliminar');
        }
    } catch (err) {
        mostrarError('errorInventario', 'Error de conexión');
    }
}
