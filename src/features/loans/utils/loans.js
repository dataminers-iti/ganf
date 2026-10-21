/**
 * Acciones de gestión disponibles para un préstamo según su estado y el rol.
 * @returns {Array<[string, string]>} pares [nuevoEstado, etiqueta]
 */
export function accionesDisponibles(prestamo, rol) {
    if (prestamo.estado === 'solicitado' && rol === 'admin') {
        return [['aprobado', 'Aprobar'], ['rechazado', 'Rechazar']];
    }
    if (prestamo.estado === 'aprobado') {
        return [['entregado', 'Marcar entregado']];
    }
    if (prestamo.estado === 'entregado') {
        return [['devuelto', 'Marcar devuelto']];
    }
    return [];
}
