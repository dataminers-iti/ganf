import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularEstadisticas, construirActividad, listarErrores } from './dashboard.js';

const datos = {
    incidencias: [
        { titulo: 'Sin red', estado: 'abierta', fecha_creacion: '2024-01-02' },
        { titulo: 'Pantalla rota', estado: 'cerrada', fecha_creacion: '2024-01-01' },
    ],
    solicitudes: [
        { tipo_servicio: 'Instalación', estado: 'pendiente', fecha_creacion: '2024-01-03' },
    ],
    inventario: [{ id: 1 }, { id: 2 }],
    prestamos: [
        { estado: 'aprobado', cantidad: '2' },
        { estado: 'entregado' },
        { estado: 'devuelto', cantidad: 5 },
    ],
    ubicaciones: [{ id: 1 }],
};

test('calcularEstadisticas cuenta solo los estados relevantes', () => {
    assert.deepEqual(calcularEstadisticas(datos), {
        incidenciasAbiertas: 1,
        solicitudesPendientes: 1,
        equipos: 2,
        prestamosActivos: 3,
    });
});

test('calcularEstadisticas tolera datos faltantes', () => {
    assert.deepEqual(calcularEstadisticas({}), {
        incidenciasAbiertas: 0,
        solicitudesPendientes: 0,
        equipos: 0,
        prestamosActivos: 0,
    });
});

test('construirActividad ordena por fecha descendente y respeta el límite', () => {
    const actividad = construirActividad(datos, 2);
    assert.equal(actividad.length, 2);
    assert.equal(actividad[0].detalle, 'Instalación');
    assert.equal(actividad[1].detalle, 'Sin red');
});

test('listarErrores devuelve los mensajes sin duplicados', () => {
    const errores = listarErrores({
        a: { error: 'Fallo A' },
        b: { error: 'Fallo A' },
        c: { error: 'Fallo B' },
        d: [],
    });
    assert.deepEqual(errores, ['Fallo A', 'Fallo B']);
});
