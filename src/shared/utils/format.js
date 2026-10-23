// Utilidades de formato puras (sin acceso al DOM).

export function formatearFecha(valor, locale) {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '-';
    return locale ? fecha.toLocaleDateString(locale) : fecha.toLocaleDateString();
}

export function recortar(texto, maximo = 50) {
    const valor = String(texto ?? '');
    return valor.length > maximo ? `${valor.slice(0, maximo)}...` : valor;
}

export function capitalizar(texto) {
    const valor = String(texto ?? '');
    return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : '';
}
