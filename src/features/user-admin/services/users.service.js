import { api } from '../../../shared/api/http.js';

export function listarUsuarios() {
    return api.get('usuarios.php?accion=listar').then(respuesta => respuesta.data || []);
}

export function listarTecnicos() {
    return api.get('usuarios.php?accion=tecnicos').then(respuesta => respuesta.data || []);
}

export function cambiarRolUsuario({ id, nuevoRol }) {
    return api.post('usuarios.php?accion=cambiar_rol', { id, nuevo_rol: nuevoRol });
}

export function cambiarActivoUsuario({ id, activo }) {
    return api.post('usuarios.php?accion=activar_desactivar', { id, activo });
}
