#!/usr/bin/env node
// Benchmark HTTP de los endpoints de SGRSI.
//
// Uso:
//   PERF_BASE_URL="http://localhost/proyecto-dateminers/api/" \
//   PERF_COOKIE="PHPSESSID=..." \
//   node scripts/perf/api-benchmark.mjs
//
// Variables opcionales:
//   PERF_SEQ=300           requests secuenciales por endpoint
//   PERF_CONC=1500         requests totales en concurrencia
//   PERF_CONCURRENCY=20    workers simultáneos
//   PERF_WARMUP=50         requests de calentamiento

import http from 'node:http';
import https from 'node:https';

const BASE = process.env.PERF_BASE_URL || 'http://localhost/proyecto-dateminers/api/';
const COOKIE = process.env.PERF_COOKIE || '';
const N_SEQ = Number(process.env.PERF_SEQ || 300);
const N_CONC = Number(process.env.PERF_CONC || 1500);
const CONCURRENCIA = Number(process.env.PERF_CONCURRENCY || 20);
const WARMUP = Number(process.env.PERF_WARMUP || 50);

const ENDPOINTS = [
    ['auth sesión', 'auth.php?accion=sesion'],
    ['incidencias listar', 'incidencias.php?accion=listar'],
    ['solicitudes listar', 'solicitudes.php?accion=listar'],
    ['inventario listar', 'inventario.php?accion=listar'],
    ['inventario ubicaciones', 'inventario.php?accion=ubicaciones'],
    ['préstamos listar', 'prestamos.php?accion=listar'],
    ['préstamos equipos', 'prestamos.php?accion=equipos'],
    ['usuarios listar', 'usuarios.php?accion=listar'],
    ['usuarios técnicos', 'usuarios.php?accion=tecnicos'],
];

const modulo = BASE.startsWith('https:') ? https : http;
const agente = new modulo.Agent({ keepAlive: true, maxSockets: CONCURRENCIA });

if (!BASE.endsWith('/')) {
    throw new Error('PERF_BASE_URL debe terminar con "/".');
}

function unaRequest(ruta) {
    return new Promise((resolve, reject) => {
        const url = new URL(ruta, BASE);
        const inicio = process.hrtime.bigint();
        const headers = { Accept: 'application/json' };
        if (COOKIE) headers.Cookie = COOKIE;

        const req = modulo.get(url, { agent: agente, headers }, res => {
            let bytes = 0;
            res.on('data', chunk => { bytes += chunk.length; });
            res.on('end', () => {
                const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
                resolve({ ms, bytes, status: res.statusCode });
            });
        });
        req.on('error', reject);
    });
}

function percentil(ordenados, p) {
    const indice = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
    return ordenados[Math.max(0, indice)];
}

function resumen(muestras, duracionMs) {
    const tiempos = muestras.map(m => m.ms).sort((a, b) => a - b);
    const suma = tiempos.reduce((total, t) => total + t, 0);
    const errores = muestras.filter(m => m.status >= 400).length;
    const bytes = muestras.reduce((total, m) => total + m.bytes, 0) / muestras.length;

    return {
        n: tiempos.length,
        avg: +(suma / tiempos.length).toFixed(3),
        p50: +percentil(tiempos, 50).toFixed(3),
        p95: +percentil(tiempos, 95).toFixed(3),
        p99: +percentil(tiempos, 99).toFixed(3),
        min: +tiempos[0].toFixed(3),
        max: +tiempos[tiempos.length - 1].toFixed(3),
        rps: +(muestras.length / (duracionMs / 1000)).toFixed(0),
        bytes: +bytes.toFixed(0),
        errores,
    };
}

async function secuencial(ruta, n) {
    const muestras = [];
    const inicio = process.hrtime.bigint();
    for (let i = 0; i < n; i++) muestras.push(await unaRequest(ruta));
    const duracion = Number(process.hrtime.bigint() - inicio) / 1e6;
    return resumen(muestras, duracion);
}

async function concurrente(ruta, total, concurrencia) {
    const muestras = [];
    let siguiente = 0;
    const inicio = process.hrtime.bigint();

    async function worker() {
        while (siguiente < total) {
            siguiente++;
            muestras.push(await unaRequest(ruta));
        }
    }

    await Promise.all(Array.from({ length: concurrencia }, worker));
    const duracion = Number(process.hrtime.bigint() - inicio) / 1e6;
    return resumen(muestras, duracion);
}

const resultados = [];

for (const [nombre, ruta] of ENDPOINTS) {
    for (let i = 0; i < WARMUP; i++) await unaRequest(ruta);
    resultados.push({
        nombre,
        endpoint: ruta,
        secuencial: await secuencial(ruta, N_SEQ),
        concurrencia: await concurrente(ruta, N_CONC, CONCURRENCIA),
    });
}

agente.destroy();
console.log(JSON.stringify({
    fecha: new Date().toISOString(),
    base: BASE,
    configuracion: { warmup: WARMUP, secuencial: N_SEQ, concurrente: N_CONC, workers: CONCURRENCIA },
    resultados,
}, null, 2));
