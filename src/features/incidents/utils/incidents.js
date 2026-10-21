const ETIQUETAS_ESTADO = {
    abierta: 'Abierta',
    en_proceso: 'En proceso',
    resuelta: 'Resuelta',
    cerrada: 'Cerrada',
};

export function formatEstadoIncidencia(estado) {
    return ETIQUETAS_ESTADO[estado] || estado;
}
