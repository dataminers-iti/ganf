import { ApiError } from '../../../shared/api/http.js';
import { RUTAS } from '../../../shared/config/paths.js';
import { verificarSesion } from '../../auth/index.js';
import { listarUsuarios, cambiarRolUsuario, cambiarActivoUsuario } from '../services/users.service.js';
import { renderTablaUsuarios } from '../components/users-table.js';

async function cargarUsuarios() {
    const tbody = document.getElementById('bodyUsuarios');
    if (!tbody) return;

    try {
        const usuarios = await listarUsuarios();
        tbody.innerHTML = usuarios.length
            ? renderTablaUsuarios(usuarios)
            : '<tr><td colspan="6">No hay usuarios registrados</td></tr>';
    } catch {
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar usuarios</td></tr>';
    }
}

async function cambiarRol(id, nuevoRol) {
    const estado = document.getElementById('estadoUsuarios');
    try {
        await cambiarRolUsuario({ id, nuevoRol });
        if (estado) estado.textContent = 'Rol actualizado correctamente.';
    } catch (error) {
        if (estado) estado.textContent = error instanceof ApiError ? error.message : 'Error de conexión';
        await cargarUsuarios(); // Revierte el select al valor real.
    }
}

async function toggleActivo(id, nuevoEstado) {
    const estado = document.getElementById('estadoUsuarios');
    try {
        await cambiarActivoUsuario({ id, activo: nuevoEstado });
        await cargarUsuarios();
    } catch (error) {
        if (estado) estado.textContent = error instanceof ApiError ? error.message : 'Error de conexión';
    }
}

export function initUsersPage() {
    // Puente para los onclick inline de la tabla.
    window.cambiarRol = cambiarRol;
    window.toggleActivo = toggleActivo;

    document.addEventListener('DOMContentLoaded', async () => {
        const usuario = await verificarSesion();
        if (!usuario || usuario.rol !== 'admin') {
            window.location.href = RUTAS.panel;
            return;
        }
        await cargarUsuarios();
    });
}
