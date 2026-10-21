import test from 'node:test';
import assert from 'node:assert/strict';
import { formatEstadoSolicitud } from './service-requests.js';

test('formatEstadoSolicitud traduce los estados conocidos', () => {
    assert.equal(formatEstadoSolicitud('pendiente'), 'Pendiente');
    assert.equal(formatEstadoSolicitud('en_proceso'), 'En proceso');
    assert.equal(formatEstadoSolicitud('completada'), 'Completada');
    assert.equal(formatEstadoSolicitud('rechazada'), 'Rechazada');
});

test('formatEstadoSolicitud devuelve el valor original si no lo conoce', () => {
    assert.equal(formatEstadoSolicitud('otro'), 'otro');
});
