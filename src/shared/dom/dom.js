// Helpers de DOM compartidos por las vistas.

/**
 * Escapa texto antes de insertarlo con innerHTML.
 * Evita inyección de HTML/JS desde datos que vienen del servidor.
 */
export function escapeHtml(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function mostrarError(idElemento, mensaje) {
    const elemento = document.getElementById(idElemento);
    if (elemento) elemento.textContent = mensaje;
}

export function limpiarCampo(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) elemento.value = '';
}
