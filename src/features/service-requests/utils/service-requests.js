const ETIQUETAS_ESTADO = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    rechazada: 'Rechazada',
};

export function formatEstadoSolicitud(estado) {
    return ETIQUETAS_ESTADO[estado] || estado;
}
