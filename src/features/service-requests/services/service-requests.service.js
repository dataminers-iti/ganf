import { api } from '../../../shared/api/http.js';

export function listarSolicitudes() {
    return api.get('solicitudes.php?accion=listar').then(respuesta => respuesta.data || []);
}

export function crearSolicitud({ tipoServicio, descripcion, prioridad }) {
    return api.post('solicitudes.php?accion=crear', {
        tipo_servicio: tipoServicio,
        descripcion,
        prioridad,
    });
}

export function actualizarEstadoSolicitud({ id, estado }) {
    return api.post('solicitudes.php?accion=actualizar', { id, estado });
}

export function asignarTecnicoSolicitud({ id, tecnicoId }) {
    return api.post('solicitudes.php?accion=asignar', { id, tecnico_id: tecnicoId });
}

export function cambiarPrioridadSolicitud({ id, prioridad }) {
    return api.post('solicitudes.php?accion=cambiar_prioridad', { id, prioridad });
}

export function eliminarSolicitud(id) {
    return api.post('solicitudes.php?accion=eliminar', { id });
}
