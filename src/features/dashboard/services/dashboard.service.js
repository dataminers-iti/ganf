import { api } from '../../../shared/api/http.js';

const FUENTES = {
    incidencias: 'incidencias.php?accion=listar',
    solicitudes: 'solicitudes.php?accion=listar',
    inventario: 'inventario.php?accion=listar',
    prestamos: 'prestamos.php?accion=listar',
    ubicaciones: 'inventario.php?accion=ubicaciones',
};

/**
 * Carga en paralelo los datos de todas las fuentes del panel.
 * Cada fuente falla de forma aislada: devuelve { error } en lugar de romper el resto.
 */
export async function cargarResumen() {
    const resultados = await Promise.all(
        Object.entries(FUENTES).map(async ([clave, ruta]) => {
            try {
                const respuesta = await api.get(ruta);
                return [clave, Array.isArray(respuesta.data) ? respuesta.data : []];
            } catch (error) {
                return [clave, { error: error.message || `No se pudieron cargar ${clave}.` }];
            }
        }),
    );
    return Object.fromEntries(resultados);
}
