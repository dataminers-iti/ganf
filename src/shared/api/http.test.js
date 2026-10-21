import test from 'node:test';
import assert from 'node:assert/strict';
import { aFormData } from './http.js';

test('aFormData incluye los campos definidos y omite null/undefined', () => {
    const formData = aFormData({ nombre: 'Ana', id: 0, vacio: '', nulo: null, indefinido: undefined });

    assert.equal(formData.get('nombre'), 'Ana');
    assert.equal(formData.get('id'), '0');
    assert.equal(formData.get('vacio'), '');
    assert.equal(formData.has('nulo'), false);
    assert.equal(formData.has('indefinido'), false);
});
