import test from 'node:test';
import assert from 'node:assert/strict';
import { formatEstadoEquipo } from './inventory.js';

test('formatEstadoEquipo traduce los estados conocidos', () => {
    assert.equal(formatEstadoEquipo('activo'), 'Activo');
    assert.equal(formatEstadoEquipo('en_reparacion'), 'En reparación');
    assert.equal(formatEstadoEquipo('de_baja'), 'De baja');
});

test('formatEstadoEquipo devuelve el valor original si no lo conoce', () => {
    assert.equal(formatEstadoEquipo('otro'), 'otro');
});
