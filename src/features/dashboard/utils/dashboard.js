// Cálculos puros del panel principal.

function lista(datos, clave) {
    return Array.isArray(datos?.[clave]) ? datos[clave] : [];
}

export function calcularEstadisticas(datos = {}) {
    return {
        incidenciasAbiertas: lista(datos, 'incidencias')
            .filter(incidencia => ['abierta', 'en_proceso'].includes(incidencia.estado))
            .length,
        solicitudesPendientes: lista(datos, 'solicitudes')
            .filter(solicitud => ['pendiente', 'en_proceso'].includes(solicitud.estado))
            .length,
        equipos: lista(datos, 'inventario').length,
        prestamosActivos: lista(datos, 'prestamos')
            .filter(prestamo => ['aprobado', 'entregado'].includes(prestamo.estado))
            .reduce((total, prestamo) => total + Number(prestamo.cantidad || 1), 0),
    };
}

export function construirActividad(datos = {}, limite = 6) {
    const actividad = [
        ...lista(datos, 'incidencias').map(incidencia => ({
            tipo: 'Incidencia',
            detalle: incidencia.titulo,
            estado: incidencia.estado,
            fecha: incidencia.fecha_creacion,
        })),
        ...lista(datos, 'solicitudes').map(solicitud => ({
            tipo: 'Servicio',
            detalle: solicitud.tipo_servicio,
            estado: solicitud.estado,
            fecha: solicitud.fecha_creacion,
        })),
    ];

    return actividad
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, limite);
}

export function listarErrores(datos = {}) {
    const errores = Object.values(datos)
        .filter(valor => !Array.isArray(valor) && valor?.error)
        .map(valor => valor.error);
    return [...new Set(errores)];
}
