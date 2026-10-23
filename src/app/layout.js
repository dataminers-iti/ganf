// Shell de la aplicación: sidebar, topbar y contenido.
// Es código de composición (app) y puede depender de features y shared.

import { escapeHtml } from '../shared/dom/dom.js';
import { RUTAS, bindNavigationGlobals } from './routes.js';
import { getUsuarioActual, logout } from '../features/auth/index.js';
import { icono } from '../shared/ui/icons.js';
import { montarVolverArriba } from '../shared/ui/back-to-top.js';

const RUTA_LOGO = new URL('../shared/assets/logo.webp', import.meta.url).href;

function pathnameActual() {
    const pathname = window.location.pathname;
    return pathname.endsWith('/') ? `${pathname}index.html` : pathname;
}

function esPaginaPublica() {
    const actual = pathnameActual();
    return [RUTAS.login, RUTAS.registro].some(ruta => new URL(ruta).pathname === actual);
}

function construirItems(usuario) {
    return [
        [RUTAS.panel, 'inicio', 'Panel principal'],
        [RUTAS.incidencias, 'incidencia', 'Incidencias'],
        ...(['admin', 'solicitante', 'tecnico'].includes(usuario?.rol)
            ? [[RUTAS.servicio, 'llave', 'Solicitudes']]
            : []),
        [RUTAS.inventario, 'cajas', 'Inventario'],
        ...(usuario?.rol === 'admin'
            ? [[`${RUTAS.inventario}#ubicaciones`, 'ubicacion', 'Ubicaciones']]
            : []),
        [RUTAS.prestamos, 'intercambio', 'Préstamos'],
        ...(usuario?.rol === 'admin'
            ? [[RUTAS.adminUsuarios, 'usuarios', 'Usuarios y técnicos']]
            : []),
    ];
}

function construirSidebar(itemsGestion, itemsAdministracion) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';

    const enlace = ([href, nombreIcono, etiqueta]) => {
        const activo = href.includes('#')
            ? window.location.hash === href.slice(href.indexOf('#'))
            : new URL(href).pathname === pathnameActual() && window.location.hash !== '#ubicaciones';
        return `<a class="sidebar-link ${activo ? 'active' : ''}" href="${href}" title="${etiqueta}" aria-label="${etiqueta}">${icono(nombreIcono, 'nav-icon')}<span>${etiqueta}</span></a>`;
    };

    sidebar.innerHTML = `<a class="app-brand" href="${RUTAS.panel}" aria-label="SGRSI ITI"><span class="app-brand-mark"><img src="${RUTA_LOGO}" alt=""></span><span>SGRSI <small>ITI</small></span></a>
        <div class="sidebar-label">Gestión</div>

        <nav aria-label="Gestión">${itemsGestion.map(enlace).join('')}</nav>
        ${itemsAdministracion.length ? `<div class="sidebar-label sidebar-label-admin">Administración</div><nav aria-label="Administración">${itemsAdministracion.map(enlace).join('')}</nav>` : ''}
        <div class="sidebar-foot">Mesa de ayuda<br><small>Sistema SGRSI · ITI</small></div>`;

    return sidebar;
}

function construirTopbar(usuario, items) {
    const topbar = document.createElement('header');
    topbar.className = 'app-topbar';

    const nombreSeccion = window.location.hash === '#ubicaciones'
        ? 'Ubicaciones'
        : (items.find(item => new URL(item[0]).pathname === pathnameActual())?.[2] || 'Sistema');

    const iniciales = (usuario?.nombre || 'U')
        .split(/\s+/)
        .slice(0, 2)
        .map(nombre => nombre[0])
        .join('')
        .toUpperCase();

    topbar.innerHTML = `<button type="button" class="mobile-menu" onclick="toggleMobileNav()" aria-label="Abrir menú">${icono('menu')}</button><span class="breadcrumb-label">SGRSI <span>›</span> ${nombreSeccion}</span>
        <div class="topbar-user"><span>${escapeHtml(usuario?.nombre || '')} <small>${escapeHtml(usuario?.rol || '')}</small></span><span class="topbar-avatar">${escapeHtml(iniciales)}</span><button type="button" class="btn-logout" onclick="logout()">${icono('salir')}Salir</button></div>`;

    return topbar;
}

export function toggleMobileNav() {
    document.querySelector('.app-sidebar')?.classList.toggle('mobile-open');
}

function montarShell() {
    if (esPaginaPublica()) return;

    const usuario = getUsuarioActual();
    const items = construirItems(usuario);
    const itemsGestion = items.filter(item => item[0] !== RUTAS.adminUsuarios);
    const itemsAdministracion = items.filter(item => item[0] === RUTAS.adminUsuarios);

    const sidebar = construirSidebar(itemsGestion, itemsAdministracion);
    const topbar = construirTopbar(usuario, items);

    const content = document.createElement('div');
    content.className = 'app-content';
    const movable = [...document.body.children].filter(
        elemento => !elemento.classList.contains('dark-btn')
            && !(elemento.tagName === 'SCRIPT' && !elemento.src),
    );
    movable.forEach(elemento => content.appendChild(elemento));

    const main = document.createElement('div');
    main.className = 'app-main';
    main.append(topbar, content);

    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.append(sidebar, main);
    document.body.appendChild(shell);

    const darkButton = document.querySelector('.dark-btn');
    if (darkButton) topbar.querySelector('.topbar-user')?.insertBefore(darkButton, topbar.querySelector('.btn-logout'));
}

// Puentes para los onclick inline del HTML generado.
window.toggleMobileNav = toggleMobileNav;
window.logout = logout;
bindNavigationGlobals();

document.addEventListener('DOMContentLoaded', () => {
    montarShell();
    if (!esPaginaPublica()) montarVolverArriba();
});
