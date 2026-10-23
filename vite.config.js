// Build MPA: cada HTML es una entrada y arrastra su JS y su CSS.
// - base './' → funciona en la raíz del dominio o en un subdirectorio (XAMPP).
// - El CSS de cada página entra por su punto de entrada en styles/entradas/ y
//   Vite lo empaqueta en un solo archivo minificado con hash.
// - api/ (PHP) se copia a dist/api para que el build sea desplegable tal cual.
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { devPlugin } from './scripts/dev/plugin.js';

const raiz = fileURLToPath(new URL('.', import.meta.url));
const pagina = ruta => resolve(raiz, ruta);

function copiarApiPhp() {
    return {
        name: 'copiar-api-php',
        apply: 'build',
        closeBundle() {
            const origen = resolve(raiz, 'api');
            if (existsSync(origen)) {
                cpSync(origen, resolve(raiz, 'dist/api'), { recursive: true });
            }
        },
    };
}

// En desarrollo el backend PHP no lo sirve Vite. devPlugin() (scripts/dev/) lee `.dev` y
// simula la API (API_MODE=mock) o reenvía /api al PHP real (API_MODE=proxy + API_TARGET).
// VITE_API_PROXY sigue valiendo como alias de API_TARGET.
export default defineConfig({
    base: './',
    plugins: [copiarApiPhp(), devPlugin()],
    server: {
        port: 5173,
    },
    preview: {
        port: 4173,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                login: pagina('index.html'),
                registro: pagina('sites/registro.html'),
                principal: pagina('sites/principal.html'),
                incidencias: pagina('sites/incidencias.html'),
                servicio: pagina('sites/servicio.html'),
                inventario: pagina('sites/inventario.html'),
                prestamos: pagina('sites/prestamos.html'),
                adminUsuarios: pagina('sites/admin_usuarios.html'),
                sistema: pagina('sites/sistema.html'),
            },
        },
    },
});
