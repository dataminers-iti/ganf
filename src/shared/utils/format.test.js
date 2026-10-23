import test from 'node:test';
import assert from 'node:assert/strict';
import { capitalizar, formatearFecha, recortar } from './format.js';

test('capitalizar pone en mayúscula la primera letra', () => {
    assert.equal(capitalizar('alta'), 'Alta');
    assert.equal(capitalizar(''), '');
    assert.equal(capitalizar(undefined), '');
});

test('recortar limita el texto y agrega puntos suspensivos', () => {
    assert.equal(recortar('texto corto', 50), 'texto corto');
    assert.equal(recortar('abcdefghij', 5), 'abcde...');
    assert.equal(recortar(undefined), '');
});

test('formatearFecha devuelve un guion para valores vacíos o inválidos', () => {
    assert.equal(formatearFecha(''), '-');
    assert.equal(formatearFecha(null), '-');
    assert.equal(formatearFecha('no-es-una-fecha'), '-');
});

test('formatearFecha formatea una fecha válida', () => {
    const resultado = formatearFecha('2024-01-15');
    assert.notEqual(resultado, '-');
    assert.match(resultado, /\d/);
});
