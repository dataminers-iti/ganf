document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await verificarSesion();
    if (!usuario) return;
    document.getElementById('mensajeBienvenida').textContent = `Bienvenido, ${usuario.nombre}. Desde aquí podés acceder a las funciones de SGRSI.`;
    const nombreUsuario = document.querySelector('.topbar-user > span:first-child');
    if (nombreUsuario) nombreUsuario.innerHTML = `${escapeHtml(usuario.nombre)} <small>${escapeHtml(usuario.rol)}</small>`;
    const avatar = document.querySelector('.topbar-avatar');
    if (avatar) avatar.textContent = (usuario.nombre || 'U').split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
    if (usuario.rol === 'usuario') document.querySelector('.quick-actions a[href="servicio.html"]')?.remove();
    const urls = {
        incidencias: 'api/incidencias.php?accion=listar',
        solicitudes: 'api/solicitudes.php?accion=listar',
        inventario: 'api/inventario.php?accion=listar',
        prestamos: 'api/prestamos.php?accion=listar',
        ubicaciones: 'api/inventario.php?accion=ubicaciones'
    };
    const resultados = await Promise.all(Object.entries(urls).map(async ([key,url]) => {
        try {
            const resp = await fetch(url); const json = await resp.json();
            if (!resp.ok || json.status !== 'exito') throw new Error(json.message || `No se pudieron cargar ${key}.`);
            return [key, json.data || []];
        } catch (error) { return [key, { error: error.message }]; }
    }));
    const datos = Object.fromEntries(resultados);
    const solo = k => Array.isArray(datos[k]) ? datos[k] : [];
    document.getElementById('statIncidencias').textContent = solo('incidencias').filter(x => ['abierta','en_proceso'].includes(x.estado)).length;
    document.getElementById('statSolicitudes').textContent = solo('solicitudes').filter(x => ['pendiente','en_proceso'].includes(x.estado)).length;
    document.getElementById('statEquipos').textContent = solo('inventario').length;
    document.getElementById('statPrestamos').textContent = solo('prestamos').filter(x => ['aprobado','entregado'].includes(x.estado)).reduce((n,x) => n + Number(x.cantidad || 1), 0);
    const actividad = [
        ...solo('incidencias').map(x => ({tipo:'Incidencia', detalle:x.titulo, estado:x.estado, fecha:x.fecha_creacion})),
        ...solo('solicitudes').map(x => ({tipo:'Servicio', detalle:x.tipo_servicio, estado:x.estado, fecha:x.fecha_creacion}))
    ].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).slice(0,6);
    document.getElementById('actividadReciente').innerHTML = actividad.length ? actividad.map(x => `<tr><td>${escapeHtml(x.detalle)}</td><td>${x.tipo}</td><td><span class="badge badge-${escapeHtml(x.estado)}">${escapeHtml(x.estado.replace('_',' '))}</span></td><td>${x.fecha ? new Date(x.fecha).toLocaleDateString('es-UY') : '—'}</td></tr>`).join('') : '<tr><td colspan="4" class="empty-note">No hay actividad registrada todavía.</td></tr>';
    document.getElementById('dashboardUbicaciones').innerHTML = solo('ubicaciones').length ? solo('ubicaciones').slice(0,4).map(u => `<div class="location-row"><span class="location-row-icon">⌖</span><span><strong>${escapeHtml(u.nombre)}</strong><small>${escapeHtml([u.edificio,u.tipo,u.piso,u.referencia].filter(Boolean).join(' · '))}</small></span></div>`).join('') : '<p class="location-empty">Todavía no hay ubicaciones cargadas.</p>';
    const errores = Object.values(datos).filter(v => !Array.isArray(v)).map(v => v.error);
    if (errores.length) document.getElementById('errorDashboard').textContent = [...new Set(errores)].join(' ');
});
