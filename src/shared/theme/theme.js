// Tema claro/oscuro. Sigue al sistema hasta que la persona elige; la elección se guarda.
// El atributo data-theme lo fija antes de pintar el script del <head> de cada página.

import { hidratarIconos } from '../ui/icons.js';

const CLAVE_TEMA = 'dm-theme';

function temaActual() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function actualizarControlTema() {
    const oscuro = temaActual() === 'dark';
    const boton = document.querySelector('.dark-btn');
    if (!boton) return;

    const etiqueta = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    boton.setAttribute('aria-label', etiqueta);
    boton.setAttribute('title', etiqueta);
    boton.setAttribute('aria-pressed', String(oscuro));
    boton.querySelector('.theme-icon-moon')?.toggleAttribute('hidden', oscuro);
    boton.querySelector('.theme-icon-sun')?.toggleAttribute('hidden', !oscuro);
}

export function toggleDark() {
    const siguiente = temaActual() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = siguiente;
    try { localStorage.setItem(CLAVE_TEMA, siguiente); } catch { /* almacenamiento no disponible: vale solo para esta página */ }
    actualizarControlTema();
}

export function initTheme() {
    hidratarIconos();
    actualizarControlTema();
}

// Puente para los onclick inline del HTML.
window.toggleDark = toggleDark;

window.addEventListener('DOMContentLoaded', initTheme);
