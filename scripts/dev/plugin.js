// Plugin de Vite solo para `bun dev` (apply: 'serve'; nunca entra al build).
//   - Lee las variables de `.dev` (ver .dev.example).
//   - API_MODE=mock: responde /api/* con la API simulada en memoria (mock-api.js).
//   - API_MODE=proxy: reenvía /api/* al PHP real en API_TARGET.
//   - Loguea cada llamada a /api/ en la terminal y inyecta el cliente que las muestra en el navegador.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cargarConfigDev } from './env.js';
import { CLAVE_DEV, crearMockApi, usuariosDePrueba } from './mock-api.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const CLIENTE = fileURLToPath(new URL('./client.js', import.meta.url));

const color = process.stdout.isTTY || process.env.FORCE_COLOR;
const pintar = (codigo, texto) => (color ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const tenue = texto => pintar('2', texto);
const colorEstado = estado => (estado >= 500 || estado === 0 ? '31' : estado >= 400 ? '33' : '32');

const hora = () => new Date().toLocaleTimeString('es-UY', { hour12: false });
const esperar = ms => new Promise(resolver => setTimeout(resolver, ms));

async function leerCampos(req) {
    if (req.method === 'GET' || req.method === 'HEAD') return {};
    const partes = [];
    for await (const parte of req) partes.push(parte);
    const cuerpo = Buffer.concat(partes);
    if (!cuerpo.length) return {};
    try {
        const formulario = await new Response(cuerpo, { headers: { 'content-type': req.headers['content-type'] ?? '' } }).formData();
        return Object.fromEntries([...formulario].map(([clave, valor]) => [clave, String(valor)]));
    } catch {
        return {};
    }
}

const enmascarar = campos => Object.fromEntries(
    Object.entries(campos).map(([clave, valor]) => [clave, /clave|password|token/i.test(clave) ? '********' : valor]),
);

function lineaLog({ metodo, ruta, estado, ms, origen }) {
    return `${tenue(hora())} ${pintar('36;1', '[api]')} ${metodo.padEnd(4)} ${ruta} ${pintar(colorEstado(estado), String(estado))} ${tenue(`${ms}ms ${origen}`)}`;
}

export function devPlugin() {
    const dev = cargarConfigDev(RAIZ);
    const sinTarget = dev.modo === 'proxy' && !dev.target;
    const modo = sinTarget ? 'mock' : dev.modo;
    const mock = modo === 'mock' ? crearMockApi() : null;

    return {
        name: 'sgrsi-dev',
        apply: 'serve',

        config() {
            const proxy = modo === 'proxy'
                ? { '/api': { target: dev.target, changeOrigin: true, cookieDomainRewrite: '' } }
                : undefined;
            return { server: { port: dev.port, proxy } };
        },

        configureServer(servidor) {
            const { logger } = servidor.config;

            servidor.httpServer?.once('listening', () => {
                if (dev.creado) logger.info(`${pintar('36;1', '[dev]')} Se creó .dev desde .dev.example`);
                if (sinTarget) logger.warn(`${pintar('33;1', '[dev]')} API_MODE=proxy sin API_TARGET en .dev: se usa el mock`);
                logger.info(modo === 'mock'
                    ? `${pintar('36;1', '[dev]')} API simulada en memoria (API_MODE=mock). Contraseña de los usuarios de prueba: ${CLAVE_DEV}`
                    : `${pintar('36;1', '[dev]')} API real: /api -> ${dev.target}`);
            });

            servidor.middlewares.use(async (req, res, next) => {
                const url = new URL(req.url ?? '/', 'http://localhost');
                const coincidencia = url.pathname.match(/^\/api\/([^/]+\.php)$/);
                if (!coincidencia) return next();

                const metodo = req.method ?? 'GET';
                const ruta = `${coincidencia[1]}${url.search}`;
                const inicio = performance.now();

                if (!mock) {
                    res.on('finish', () => {
                        if (dev.log) logger.info(lineaLog({ metodo, ruta, estado: res.statusCode, ms: Math.round(performance.now() - inicio), origen: 'proxy' }));
                    });
                    return next();
                }

                const campos = await leerCampos(req);
                if (dev.latencia) await esperar(dev.latencia);
                const { estado, cuerpo } = mock.manejar({
                    metodo,
                    endpoint: coincidencia[1],
                    accion: url.searchParams.get('accion'),
                    campos,
                });

                res.statusCode = estado;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(cuerpo));

                if (!dev.log) return;
                logger.info(lineaLog({ metodo, ruta, estado, ms: Math.round(performance.now() - inicio), origen: 'mock' }));
                if (dev.bodies) {
                    if (Object.keys(campos).length) logger.info(`${tenue('       pedido    ')} ${JSON.stringify(enmascarar(campos))}`);
                    logger.info(`${tenue('       respuesta')} ${cuerpo.message}`);
                }
            });
        },

        transformIndexHtml() {
            const config = {
                modo,
                target: dev.target,
                log: dev.log,
                bodies: dev.bodies,
                panel: dev.panel,
                usuarios: modo === 'mock' ? usuariosDePrueba() : [],
                clavePrueba: CLAVE_DEV,
            };
            return [{
                tag: 'script',
                children: `window.__SGRSI_DEV__=${JSON.stringify(config)};\n${readFileSync(CLIENTE, 'utf8')}`,
                injectTo: 'head-prepend',
            }];
        },
    };
}
