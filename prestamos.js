let rolPrestamo = '';
document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await verificarSesion();
    if (!usuario) return;
    rolPrestamo = usuario.rol;
    if (!['admin','tecnico'].includes(rolPrestamo)) document.getElementById('colAccionesPrestamo').style.display = 'none';
    else document.getElementById('colAccionesPrestamo').style.display = '';
    await cargarEquiposPrestamo();
    await cargarPrestamos();
});

async function cargarEquiposPrestamo() {
    const select = document.getElementById('equipoPrestamo');
    try {
        const r = await fetch('api/prestamos.php?accion=equipos'); const d = await r.json();
        if (!r.ok || d.status !== 'exito') throw new Error(d.message || 'No se pudo consultar el inventario.');
        const disponibles = d.data || [];
        select.innerHTML = '<option value="">Seleccione un equipo</option>' + disponibles.map(e => `<option value="${e.id}" data-disponible="${e.disponible}">${escapeHtml(e.nombre)}${e.numero_serie ? ` · ${escapeHtml(e.numero_serie)}` : ''} · ${e.disponible} disponibles</option>`).join('');
        if (!disponibles.length) select.innerHTML = '<option value="">No hay equipos disponibles</option>';
        select.onchange = () => { document.getElementById('cantidadPrestamo').max = select.selectedOptions[0]?.dataset.disponible || 1; };
    } catch (error) { select.innerHTML = `<option value="">${escapeHtml(error.message || 'No se pudo cargar el inventario')}</option>`; }
}

async function cargarPrestamos() {
    try {
        const r = await fetch('api/prestamos.php?accion=listar'); const d = await r.json();
        if (!r.ok || d.status !== 'exito') throw new Error(d.message || 'No se pudieron cargar los préstamos.');
        const rows = d.data || []; const tbody = document.getElementById('bodyPrestamos');
        if (!rows.length) { tbody.innerHTML = '<tr><td colspan="7">Todavía no hay préstamos registrados.</td></tr>'; return; }
        tbody.innerHTML = rows.map(p => `<tr><td>${escapeHtml(p.nombre_equipo)} (${p.cantidad})</td><td>${escapeHtml(p.numero_serie) || '—'}</td><td>${escapeHtml(p.nombre_usuario)}</td><td>${new Date(p.fecha_solicitud).toLocaleDateString()}</td><td>${p.fecha_devolucion_prevista || '—'}</td><td><span class="badge badge-${p.estado}">${escapeHtml(p.estado)}</span></td>${['admin','tecnico'].includes(rolPrestamo) ? `<td>${accionesPrestamo(p)}</td>` : ''}</tr>`).join('');
    } catch (error) { document.getElementById('bodyPrestamos').innerHTML = `<tr><td colspan="7">${escapeHtml(error.message || 'No se pudieron cargar los préstamos.')}</td></tr>`; }
}

function accionesPrestamo(p) {
    const opts = p.estado === 'solicitado' && rolPrestamo === 'admin' ? [['aprobado','Aprobar'],['rechazado','Rechazar']] : p.estado === 'aprobado' ? [['entregado','Marcar entregado']] : p.estado === 'entregado' ? [['devuelto','Marcar devuelto']] : [];
    return opts.map(([estado,label]) => `<button type="button" class="btn-secundario" onclick="actualizarPrestamo(${p.id},'${estado}')">${label}</button>`).join('') + `<button type="button" class="btn-delete-inc" aria-label="Borrar préstamo" onclick="borrarPrestamo(${p.id}, this)" data-equipo="${escapeHtml(p.nombre_equipo)}"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button>`;
}

async function solicitarPrestamo() {
    mostrarError('errorPrestamo',''); document.getElementById('estadoPrestamo').textContent = '';
    const f = new FormData(); f.append('equipo_id', document.getElementById('equipoPrestamo').value); f.append('motivo', document.getElementById('motivoPrestamo').value.trim()); f.append('cantidad', document.getElementById('cantidadPrestamo').value); f.append('fecha_devolucion_prevista', document.getElementById('fechaPrestamo').value);
    try {
        const r = await fetch('api/prestamos.php?accion=crear',{method:'POST',body:f}); const d = await r.json();
        if (!r.ok && !d.message) throw new Error('No se pudo enviar la solicitud.');
        if (d.status !== 'exito') throw new Error(d.message || 'No se pudo enviar la solicitud.');
        document.getElementById('estadoPrestamo').textContent = d.message; document.getElementById('motivoPrestamo').value = ''; document.getElementById('fechaPrestamo').value = ''; document.getElementById('cantidadPrestamo').value = '1';
        await cargarPrestamos(); await cargarEquiposPrestamo();
    } catch (e) { mostrarError('errorPrestamo', e.message || 'Error de conexión.'); }
}

async function actualizarPrestamo(id, estado) {
    const f = new FormData(); f.append('id',id); f.append('estado',estado);
    try { const r=await fetch('api/prestamos.php?accion=actualizar',{method:'POST',body:f}); const d=await r.json(); if(!r.ok || d.status!=='exito') throw new Error(d.message); document.getElementById('estadoPrestamo').textContent=d.message; await cargarPrestamos(); await cargarEquiposPrestamo(); }
    catch(e) { mostrarError('errorPrestamo',e.message || 'No se pudo actualizar el préstamo.'); }
}

async function borrarPrestamo(id, boton) {
    const equipo=boton.dataset.equipo;
    const ok=await confirmarAccionCentrada({titulo:'Borrar préstamo',mensaje:`¿Seguro que querés borrar el préstamo de «${equipo}»? Esta acción no se puede deshacer.`,confirmar:'Sí, borrar',peligro:true});
    if(!ok)return;
    const f=new FormData();f.append('id',id);
    try{const r=await fetch('api/prestamos.php?accion=eliminar',{method:'POST',body:f});const d=await r.json();if(!r.ok||d.status!=='exito')throw new Error(d.message);document.getElementById('estadoPrestamo').textContent=d.message;await cargarPrestamos();await cargarEquiposPrestamo();}
    catch(e){mostrarError('errorPrestamo',e.message||'No se pudo borrar el préstamo.');}
}
