import { api } from '../../../shared/api/http.js';

export function listarUbicaciones() {
    return api.get('inventario.php?accion=ubicaciones').then(respuesta => respuesta.data || []);
}

export function crearUbicacion({ edificio, tipo, nombre, piso, referencia }) {
    return api.post('inventario.php?accion=crear_ubicacion', {
        edificio,
        tipo,
        nombre,
        piso,
        referencia,
    });
}

export function eliminarUbicacion(id) {
    return api.post('inventario.php?accion=eliminar_ubicacion', { id });
}
