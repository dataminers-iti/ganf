import { api } from '../../../shared/api/http.js';

export function listarEquipos() {
    return api.get('inventario.php?accion=listar').then(respuesta => respuesta.data || []);
}

/**
 * Crea o actualiza un equipo según venga o no el id.
 */
export function guardarEquipo(datos) {
    const accion = datos.id ? 'editar' : 'agregar';
    return api.post(`inventario.php?accion=${accion}`, datos);
}

export function eliminarEquipo(id) {
    return api.post('inventario.php?accion=eliminar', { id });
}
