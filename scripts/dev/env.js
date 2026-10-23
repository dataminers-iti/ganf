// Variables del modo desarrollo. Se leen de `.dev` (formato KEY=VALOR) en la raíz del repo.
// Una variable de entorno con el mismo nombre gana sobre el archivo: `API_MODE=proxy bun dev`.

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULTS = Object.freeze({
    PORT: '5173',
    API_MODE: 'mock',
    API_TARGET: '',
    API_LOG: 'true',
    API_LOG_BODIES: 'true',
    API_LATENCY_MS: '0',
    DEV_PANEL: 'true',
});

export function parsearDev(texto) {
    const variables = {};
    for (const linea of texto.split(/\r?\n/)) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('#')) continue;
        const igual = limpia.indexOf('=');
        if (igual < 1) continue;

        const clave = limpia.slice(0, igual).trim();
        let valor = limpia.slice(igual + 1).trim();
        const comillas = valor[0] === '"' || valor[0] === "'";
        if (comillas && valor.endsWith(valor[0]) && valor.length > 1) {
            valor = valor.slice(1, -1);
        } else {
            valor = valor.replace(/\s+#.*$/, '');
        }
        variables[clave] = valor;
    }
    return variables;
}

const verdadero = valor => ['1', 'true', 'si', 'yes', 'on'].includes(String(valor).toLowerCase());

export function resolverConfig(archivo = {}, entorno = process.env) {
    const crudo = { ...DEFAULTS };
    for (const clave of Object.keys(DEFAULTS)) {
        if (archivo[clave] !== undefined) crudo[clave] = archivo[clave];
        if (entorno[clave] !== undefined && entorno[clave] !== '') crudo[clave] = entorno[clave];
    }
    // Compatibilidad con la variable que ya existía en vite.config.js
    if (!crudo.API_TARGET && entorno.VITE_API_PROXY) crudo.API_TARGET = entorno.VITE_API_PROXY;

    const modo = crudo.API_MODE === 'proxy' ? 'proxy' : 'mock';
    return {
        port: Number(crudo.PORT) || 5173,
        modo,
        target: crudo.API_TARGET.replace(/\/+$/, ''),
        log: verdadero(crudo.API_LOG),
        bodies: verdadero(crudo.API_LOG_BODIES),
        latencia: Math.max(0, Number(crudo.API_LATENCY_MS) || 0),
        panel: verdadero(crudo.DEV_PANEL),
    };
}

/** Lee `.dev`; si no existe lo crea desde `.dev.example` para que `bun dev` arranque sin pasos previos. */
export function cargarConfigDev(raiz, { crear = true } = {}) {
    const ruta = resolve(raiz, '.dev');
    const ejemplo = resolve(raiz, '.dev.example');
    let creado = false;
    if (!existsSync(ruta) && crear && existsSync(ejemplo)) {
        copyFileSync(ejemplo, ruta);
        creado = true;
    }
    const archivo = existsSync(ruta) ? parsearDev(readFileSync(ruta, 'utf8')) : {};
    return { ...resolverConfig(archivo), creado, ruta };
}
