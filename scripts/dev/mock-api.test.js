import assert from 'node:assert/strict';
import test from 'node:test';
import { CLAVE_DEV, crearMockApi } from './mock-api.js';

function cliente() {
    const api = crearMockApi();
    const llamar = (metodo, endpoint, accion, campos = {}) => api.manejar({ metodo, endpoint, accion, campos });
    const entrar = correo => llamar('POST', 'auth.php', 'login', { correo, clave: CLAVE_DEV });
    return { llamar, entrar };
}

test('sin sesión la API responde 401 con el contrato { status, message, data }', () => {
    const { llamar } = cliente();
    const { estado, cuerpo } = llamar('GET', 'incidencias.php', 'listar');
    assert.equal(estado, 401);
    assert.deepEqual(cuerpo, { status: 'error', message: 'No autenticado', data: null });
});

test('login con credenciales válidas abre la sesión y logout la cierra', () => {
    const { llamar, entrar } = cliente();
    assert.equal(entrar('admin@iti.dev').estado, 200);
    assert.equal(llamar('GET', 'auth.php', 'sesion').cuerpo.data.rol, 'admin');
    llamar('POST', 'auth.php', 'logout');
    assert.equal(llamar('GET', 'auth.php', 'sesion').estado, 401);
});

test('login rechaza clave incorrecta y usuarios inactivos', () => {
    const { llamar } = cliente();
    assert.equal(llamar('POST', 'auth.php', 'login', { correo: 'admin@iti.dev', clave: 'mala' }).estado, 401);
    assert.equal(llamar('POST', 'auth.php', 'login', { correo: 'cferreira@iti.dev', clave: CLAVE_DEV }).estado, 401);
});

test('registro valida correo, largo de clave y duplicados', () => {
    const { llamar } = cliente();
    const alta = campos => llamar('POST', 'auth.php', 'registro', campos).estado;
    assert.equal(alta({ nombre: 'Ana', correo: 'mal', clave: 'abcdefgh' }), 400);
    assert.equal(alta({ nombre: 'Ana', correo: 'ana@iti.dev', clave: 'corta' }), 400);
    assert.equal(alta({ nombre: 'Ana', correo: 'ana@iti.dev', clave: 'abcdefgh' }), 201);
    assert.equal(alta({ nombre: 'Ana', correo: 'ana@iti.dev', clave: 'abcdefgh' }), 409);
});

test('el rol usuario solo ve las incidencias que reportó', () => {
    const { llamar, entrar } = cliente();
    entrar('admin@iti.dev');
    const todas = llamar('GET', 'incidencias.php', 'listar').cuerpo.data.length;
    entrar('usuario@iti.dev');
    const propias = llamar('GET', 'incidencias.php', 'listar').cuerpo.data;
    assert.ok(propias.length < todas);
    assert.ok(propias.every(i => i.nombre_reportador === 'Lucía Techera'));
});

test('crear incidencia valida los campos y la agrega al listado', () => {
    const { llamar, entrar } = cliente();
    entrar('usuario@iti.dev');
    assert.equal(llamar('POST', 'incidencias.php', 'crear', { titulo: 'x', descripcion: 'y', area: 'z' }).estado, 400);
    const creada = llamar('POST', 'incidencias.php', 'crear', { titulo: 'Pantalla rota', descripcion: 'La pantalla quedó con una grieta', area: 'Salón 1' });
    assert.equal(creada.estado, 201);
    const lista = llamar('GET', 'incidencias.php', 'listar').cuerpo.data;
    assert.equal(lista[0].titulo, 'Pantalla rota');
    assert.equal(lista[0].estado, 'abierta');
});

test('eliminar incidencia exige admin o técnico', () => {
    const { llamar, entrar } = cliente();
    entrar('usuario@iti.dev');
    assert.equal(llamar('POST', 'incidencias.php', 'eliminar', { id: '1' }).estado, 403);
    entrar('tecnico@iti.dev');
    assert.equal(llamar('POST', 'incidencias.php', 'eliminar', { id: '1' }).estado, 200);
    assert.equal(llamar('POST', 'incidencias.php', 'eliminar', { id: '1' }).estado, 404);
});

test('no se borra una ubicación con equipos asignados', () => {
    const { llamar, entrar } = cliente();
    entrar('admin@iti.dev');
    const { estado, cuerpo } = llamar('POST', 'inventario.php', 'eliminar_ubicacion', { id: '1' });
    assert.equal(estado, 409);
    assert.match(cuerpo.message, /equipos asignados/);
});

test('préstamos: no se piden más unidades de las disponibles', () => {
    const { llamar, entrar } = cliente();
    entrar('usuario@iti.dev');
    const pedido = cantidad => llamar('POST', 'prestamos.php', 'crear', { equipo_id: '4', motivo: 'Clase de prueba', cantidad: String(cantidad) });
    assert.equal(pedido(3).estado, 409);
    assert.equal(pedido(2).estado, 201);
    assert.equal(pedido(1).estado, 409);
});

test('préstamos: el método incorrecto devuelve 405', () => {
    const { llamar, entrar } = cliente();
    entrar('admin@iti.dev');
    assert.equal(llamar('GET', 'prestamos.php', 'crear').estado, 405);
});

test('usuarios.php es exclusivo de admin', () => {
    const { llamar, entrar } = cliente();
    entrar('tecnico@iti.dev');
    assert.equal(llamar('GET', 'usuarios.php', 'listar').estado, 403);
    entrar('admin@iti.dev');
    assert.equal(llamar('GET', 'usuarios.php', 'tecnicos').cuerpo.data.length, 2);
});

test('endpoint desconocido responde 404 sin lanzar', () => {
    const { llamar } = cliente();
    assert.equal(llamar('GET', 'nada.php', null).estado, 404);
});
