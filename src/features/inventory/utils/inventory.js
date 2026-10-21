const ETIQUETAS_ESTADO = {
    activo: 'Activo',
    en_reparacion: 'En reparación',
    de_baja: 'De baja',
};

export function formatEstadoEquipo(estado) {
    return ETIQUETAS_ESTADO[estado] || estado;
}
