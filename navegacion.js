// FUNCIONES DE NAVEGACIÓN
function irAPagina(ruta) {
    window.location.href = ruta;
}

function mostrarLogin() { irAPagina("pagina.html"); }
function mostrarRegistro() { irAPagina("registro.html"); }
function mostrarSistema() { irAPagina("sistema.html"); }
function mostrarInventario() { irAPagina("inventario.html"); }
function mostrarIncidencias() { irAPagina("incidencias.html"); }
function mostrarServicio() { irAPagina("servicio.html"); }
function mostrarPrincipal() { irAPagina("principal.html"); }
function mostrarAdminUsuarios() { irAPagina("admin_usuarios.html"); }
function mostrarPrestamos() { irAPagina("prestamos.html"); }

document.addEventListener('DOMContentLoaded', () => {
    const guestPages = ['pagina.html', 'registro.html'];
    if (guestPages.includes(location.pathname.split('/').pop())) return;
    const usuario = getUsuarioActual();
    const rutaActual = location.pathname.split('/').pop();
    const items = [
        ['principal.html', '⌂', 'Panel principal'],
        ['incidencias.html', '◉', 'Incidencias'],
        ...(['admin','solicitante','tecnico'].includes(usuario?.rol) ? [['servicio.html', '▤', 'Solicitudes']] : []),
        ['inventario.html', '▣', 'Inventario'],
        ...(usuario?.rol === 'admin' ? [['inventario.html#ubicaciones', '⌖', 'Ubicaciones']] : []),
        ['prestamos.html', '⇄', 'Préstamos'],
        ...(usuario?.rol === 'admin' ? [['admin_usuarios.html', '♧', 'Usuarios y técnicos']] : [])
    ];
    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = `<a class="app-brand" href="principal.html" aria-label="SGRSI ITI"><span class="app-brand-mark"><img src="ico logo.png" alt=""></span><span>SGRSI <small>· ITI</small></span></a>
        <div class="sidebar-label">Gestión</div>
        <nav aria-label="Navegación principal">${items.map(([href,icon,label]) => `<a class="sidebar-link ${(href.includes('#') ? location.hash === href.slice(href.indexOf('#')) : rutaActual === href && location.hash !== '#ubicaciones') ? 'active' : ''}" href="${href}" title="${label}" aria-label="${label}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`).join('')}</nav>
        <div class="sidebar-foot"><span class="online-dot"></span>Mesa de ayuda<br><small>Sistema SGRSI · ITI</small></div>`;
    const main = document.createElement('div');
    main.className = 'app-main';
    const topbar = document.createElement('header');
    topbar.className = 'app-topbar';
    const nombreSeccion = location.hash === '#ubicaciones' ? 'Ubicaciones' : (items.find(i => i[0] === rutaActual)?.[2] || 'Sistema');
    topbar.innerHTML = `<button type="button" class="mobile-menu" onclick="toggleMobileNav()" aria-label="Abrir menú">☰</button><span class="breadcrumb-label">SGRSI <span>›</span> ${nombreSeccion}</span>
        <div class="topbar-user"><span>${escapeHtml(usuario?.nombre || '')} <small>${escapeHtml(usuario?.rol || '')}</small></span><span class="topbar-avatar">${escapeHtml((usuario?.nombre || 'U').split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase())}</span><button type="button" class="btn-logout" onclick="logout()">Salir</button></div>`;
    const content = document.createElement('div');
    content.className = 'app-content';
    const movable = [...document.body.children].filter(el => !el.classList.contains('dark-btn') && !(el.tagName === 'SCRIPT' && !el.src));
    movable.forEach(el => content.appendChild(el));
    main.append(topbar, content);
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.append(sidebar, main);
    document.body.appendChild(shell);
    const darkButton = document.querySelector('.dark-btn');
    if (darkButton) topbar.querySelector('.topbar-user')?.insertBefore(darkButton, topbar.querySelector('.btn-logout'));
});

function toggleMobileNav() {
    document.querySelector('.app-sidebar')?.classList.toggle('mobile-open');
}

// Utilidad compartida: escapa texto antes de insertarlo con innerHTML,
// para evitar inyección de HTML/JS desde datos que vienen del servidor.
function escapeHtml(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
