// Aplicar la preferencia guardada antes de mostrar la página.
try {
    if (localStorage.getItem('modo') === 'dark') document.documentElement.classList.add('dark');
} catch (_) {}

function actualizarControlTema() {
    const oscuro = document.documentElement.classList.contains('dark');
    const boton = document.querySelector('.dark-btn');
    if (!boton) return;
    boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    boton.setAttribute('title', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    boton.setAttribute('aria-pressed', String(oscuro));
    boton.querySelector('.theme-icon-moon')?.toggleAttribute('hidden', oscuro);
    boton.querySelector('.theme-icon-sun')?.toggleAttribute('hidden', !oscuro);
}

function toggleDark() {
    const oscuro = document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
    try { localStorage.setItem('modo', oscuro ? 'dark' : 'light'); } catch (_) {}
    actualizarControlTema();
}

window.addEventListener('DOMContentLoaded', () => {
    const oscuro = document.documentElement.classList.contains('dark');
    document.body.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
    actualizarControlTema();
});
