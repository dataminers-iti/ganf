import { api } from '../../../shared/api/http.js';

export function listarIncidencias() {
    return api.get('incidencias.php?accion=listar').then(respuesta => respuesta.data || []);
}

export function crearIncidencia({ titulo, descripcion, area, prioridad }) {
    return api.post('incidencias.php?accion=crear', { titulo, descripcion, area, prioridad });
}

export function actualizarEstadoIncidencia({ id, estado }) {
    return api.post('incidencias.php?accion=actualizar', { id, estado });
}

export function asignarTecnicoIncidencia({ id, tecnicoId }) {
    return api.post('incidencias.php?accion=asignar', { id, tecnico_id: tecnicoId });
}

export function cambiarPrioridadIncidencia({ id, prioridad }) {
    return api.post('incidencias.php?accion=cambiar_prioridad', { id, prioridad });
}

export function eliminarIncidencia(id) {
    return api.post('incidencias.php?accion=eliminar', { id });
}
