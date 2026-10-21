import { ApiError } from '../../../shared/api/http.js';
import { RUTAS } from '../../../shared/config/paths.js';
import { mostrarError } from '../../../shared/dom/dom.js';
import { iniciarSesion } from '../services/auth.service.js';
import { guardarUsuario } from '../session.js';

export async function login() {
    const correo = document.getElementById('correo').value.trim();
    const clave = document.getElementById('clave').value.trim();
    mostrarError('errorLogin', '');

    if (!correo || !clave) {
        mostrarError('errorLogin', 'Por favor ingresa correo y contraseña.');
        return;
    }
    if (!correo.includes('@')) {
        mostrarError('errorLogin', 'Correo inválido.');
        return;
    }

    try {
        const respuesta = await iniciarSesion({ correo, clave });
        guardarUsuario(respuesta.data);
        window.location.href = RUTAS.panel;
    } catch (error) {
        mostrarError(
            'errorLogin',
            error instanceof ApiError ? error.message : 'Error de conexión con el servidor',
        );
    }
}
