// Cliente HTTP compartido por todas las features.
// Contrato de la API: { status: 'exito' | 'error', message, data }

import { rutaApi } from '../config/paths.js';

export class ApiError extends Error {
    constructor(mensaje, estado = 0) {
        super(mensaje);
        this.name = 'ApiError';
        this.estado = estado;
    }
}

/**
 * Ejecuta un fetch y normaliza la respuesta JSON de la API.
 * Lanza ApiError cuando el servidor responde con error o con un cuerpo inválido.
 */
export async function pedirJson(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);
    const texto = await respuesta.text();

    let datos = null;
    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        throw new ApiError('El servidor no devolvió un JSON válido.', respuesta.status);
    }

    if (!datos || datos.status !== 'exito') {
        throw new ApiError(datos?.message || `Error HTTP ${respuesta.status}`, respuesta.status);
    }

    return datos;
}

export function aFormData(campos) {
    const formData = new FormData();
    for (const [clave, valor] of Object.entries(campos)) {
        if (valor === undefined || valor === null) continue;
        formData.append(clave, valor);
    }
    return formData;
}

export const api = {
    get(ruta) {
        return pedirJson(rutaApi(ruta));
    },
    post(ruta, campos = {}) {
        return pedirJson(rutaApi(ruta), {
            method: 'POST',
            body: aFormData(campos),
        });
    },
};
