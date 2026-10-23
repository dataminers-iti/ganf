import assert from 'node:assert/strict';
import test from 'node:test';
import { parsearDev, resolverConfig } from './env.js';

test('parsearDev ignora comentarios y líneas vacías', () => {
    const variables = parsearDev('# comentario\n\nPORT=3000\n  API_MODE = proxy  \n');
    assert.deepEqual(variables, { PORT: '3000', API_MODE: 'proxy' });
});

test('parsearDev quita comillas y comentarios al final de línea', () => {
    const variables = parsearDev('API_TARGET="http://localhost/x # no"\nAPI_LOG=true # prender\n');
    assert.equal(variables.API_TARGET, 'http://localhost/x # no');
    assert.equal(variables.API_LOG, 'true');
});

test('parsearDev acepta CRLF y salta líneas sin igual', () => {
    assert.deepEqual(parsearDev('A=1\r\nsin igual\r\nB=2\r\n'), { A: '1', B: '2' });
});

test('resolverConfig usa los valores por defecto', () => {
    const config = resolverConfig({}, {});
    assert.equal(config.port, 5173);
    assert.equal(config.modo, 'mock');
    assert.equal(config.log, true);
    assert.equal(config.latencia, 0);
});

test('resolverConfig: el entorno gana sobre el archivo', () => {
    const config = resolverConfig({ API_MODE: 'mock', PORT: '4000' }, { API_MODE: 'proxy', API_TARGET: 'http://localhost/x/' });
    assert.equal(config.modo, 'proxy');
    assert.equal(config.port, 4000);
    assert.equal(config.target, 'http://localhost/x');
});

test('resolverConfig: modo inválido cae en mock y VITE_API_PROXY alimenta el target', () => {
    const config = resolverConfig({ API_MODE: 'otro' }, { VITE_API_PROXY: 'http://localhost/y' });
    assert.equal(config.modo, 'mock');
    assert.equal(config.target, 'http://localhost/y');
});

test('resolverConfig interpreta booleanos y latencia', () => {
    const config = resolverConfig({ API_LOG: 'false', API_LOG_BODIES: '0', DEV_PANEL: 'no', API_LATENCY_MS: '250' }, {});
    assert.equal(config.log, false);
    assert.equal(config.bodies, false);
    assert.equal(config.panel, false);
    assert.equal(config.latencia, 250);
});
