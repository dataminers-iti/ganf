import { ApiError } from '../../../shared/api/http.js';
import { RUTAS } from '../../../shared/config/paths.js';
import { mostrarError } from '../../../shared/dom/dom.js';
import { registrarCuenta } from '../services/auth.service.js';

export async function registro() {
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const correo = document.getElementById('nuevoCorreo').value.trim();
    const clave = document.getElementById('nuevaClave').value.trim();
    mostrarError('errorRegistro', '');

    if (!nombre || !correo || !clave) {
        mostrarError('errorRegistro', 'Por favor completa todos los campos.');
        return;
    }
    if (!correo.includes('@')) {
        mostrarError('errorRegistro', 'Correo inválido.');
        return;
    }
    if (clave.length < 8) {
        mostrarError('errorRegistro', 'Contraseña debe tener al menos 8 caracteres.');
        return;
    }

    try {
        await registrarCuenta({ nombre, correo, clave });
        mostrarError('estadoRegistro', 'Cuenta creada correctamente. Ahora podés iniciar sesión.');
        window.location.href = RUTAS.login;
    } catch (error) {
        mostrarError(
            'errorRegistro',
            error instanceof ApiError ? error.message : 'Error de conexión con el servidor',
        );
    }
}
