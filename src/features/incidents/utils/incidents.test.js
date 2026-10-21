import test from 'node:test';
import assert from 'node:assert/strict';
import { formatEstadoIncidencia } from './incidents.js';

test('formatEstadoIncidencia traduce los estados conocidos', () => {
    assert.equal(formatEstadoIncidencia('abierta'), 'Abierta');
    assert.equal(formatEstadoIncidencia('en_proceso'), 'En proceso');
    assert.equal(formatEstadoIncidencia('resuelta'), 'Resuelta');
    assert.equal(formatEstadoIncidencia('cerrada'), 'Cerrada');
});

test('formatEstadoIncidencia devuelve el valor original si no lo conoce', () => {
    assert.equal(formatEstadoIncidencia('otro'), 'otro');
});
