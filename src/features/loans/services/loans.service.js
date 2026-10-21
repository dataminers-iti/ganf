import { api } from '../../../shared/api/http.js';

export function listarEquiposDisponibles() {
    return api.get('prestamos.php?accion=equipos').then(respuesta => respuesta.data || []);
}

export function listarPrestamos() {
    return api.get('prestamos.php?accion=listar').then(respuesta => respuesta.data || []);
}

export function crearPrestamo({ equipoId, motivo, cantidad, fechaDevolucionPrevista }) {
    return api.post('prestamos.php?accion=crear', {
        equipo_id: equipoId,
        motivo,
        cantidad,
        fecha_devolucion_prevista: fechaDevolucionPrevista,
    });
}

export function actualizarEstadoPrestamo({ id, estado }) {
    return api.post('prestamos.php?accion=actualizar', { id, estado });
}

export function eliminarPrestamo(id) {
    return api.post('prestamos.php?accion=eliminar', { id });
}
