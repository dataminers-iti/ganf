// Tema claro/oscuro. La preferencia se guarda en localStorage.

const CLAVE_TEMA = 'modo';

export function actualizarControlTema() {
    const oscuro = document.documentElement.classList.contains('dark');
    const boton = document.querySelector('.dark-btn');
    if (!boton) return;

    boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    boton.setAttribute('title', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    boton.setAttribute('aria-pressed', String(oscuro));
    boton.querySelector('.theme-icon-moon')?.toggleAttribute('hidden', oscuro);
    boton.querySelector('.theme-icon-sun')?.toggleAttribute('hidden', !oscuro);
}

export function toggleDark() {
    const oscuro = document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
    try { localStorage.setItem(CLAVE_TEMA, oscuro ? 'dark' : 'light'); } catch { /* almacenamiento no disponible */ }
    actualizarControlTema();
}

export function initTheme() {
    const oscuro = document.documentElement.classList.contains('dark');
    document.body.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
    actualizarControlTema();
}

// Puente para los onclick inline del HTML.
window.toggleDark = toggleDark;

window.addEventListener('DOMContentLoaded', initTheme);
