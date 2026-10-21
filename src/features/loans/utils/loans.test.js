import test from 'node:test';
import assert from 'node:assert/strict';
import { accionesDisponibles } from './loans.js';

test('un admin puede aprobar o rechazar una solicitud pendiente', () => {
    assert.deepEqual(accionesDisponibles({ estado: 'solicitado' }, 'admin'), [
        ['aprobado', 'Aprobar'],
        ['rechazado', 'Rechazar'],
    ]);
});

test('un técnico no puede aprobar solicitudes pendientes', () => {
    assert.deepEqual(accionesDisponibles({ estado: 'solicitado' }, 'tecnico'), []);
});

test('los estados posteriores siguen su flujo', () => {
    assert.deepEqual(accionesDisponibles({ estado: 'aprobado' }, 'tecnico'), [['entregado', 'Marcar entregado']]);
    assert.deepEqual(accionesDisponibles({ estado: 'entregado' }, 'admin'), [['devuelto', 'Marcar devuelto']]);
    assert.deepEqual(accionesDisponibles({ estado: 'devuelto' }, 'admin'), []);
});
