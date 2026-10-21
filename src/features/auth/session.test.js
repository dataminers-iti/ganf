import test from 'node:test';
import assert from 'node:assert/strict';

const almacen = new Map();

globalThis.sessionStorage = {
    getItem: clave => (almacen.has(clave) ? almacen.get(clave) : null),
    setItem: (clave, valor) => almacen.set(clave, String(valor)),
    removeItem: clave => almacen.delete(clave),
};

const { getUsuarioActual, guardarUsuario, limpiarSesion, tieneRol } = await import('./session.js');

test('guarda y recupera el usuario de la sesión', () => {
    guardarUsuario({ id: 1, nombre: 'Ana', rol: 'admin' });
    assert.deepEqual(getUsuarioActual(), { id: 1, nombre: 'Ana', rol: 'admin' });
});

test('getUsuarioActual devuelve null si no hay sesión o el JSON es inválido', () => {
    limpiarSesion();
    assert.equal(getUsuarioActual(), null);

    sessionStorage.setItem('usuario', '{no-es-json');
    assert.equal(getUsuarioActual(), null);
});

test('tieneRol valida contra los roles permitidos', () => {
    guardarUsuario({ id: 1, nombre: 'Ana', rol: 'admin' });
    assert.equal(tieneRol(['admin', 'tecnico']), true);
    assert.equal(tieneRol(['usuario']), false);
    assert.equal(tieneRol(), false);
});

test('limpiarSesion elimina al usuario', () => {
    guardarUsuario({ id: 1, nombre: 'Ana', rol: 'admin' });
    limpiarSesion();
    assert.equal(getUsuarioActual(), null);
});
