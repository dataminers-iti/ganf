// Copia fuentes (@fontsource) y genera el módulo de iconos (lucide-static) dentro de src/.
// El sitio no tiene bundler: lo que se sirve debe estar en el repo. Correr con `bun run vendor`
// después de `bun install` cuando cambie la lista de iconos o la versión de las fuentes.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const nm = join(raiz, 'node_modules');
const fuentes = join(raiz, 'src/shared/fonts');
mkdirSync(fuentes, { recursive: true });

const archivos = [
    ['@fontsource-variable/valley-sans/files/valley-sans-latin-wght-normal.woff2', 'valley-sans-latin.woff2'],
    ['@fontsource-variable/merriweather/files/merriweather-latin-opsz-normal.woff2', 'merriweather-latin.woff2'],
    ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', 'jetbrains-mono-latin.woff2'],
    ['@fontsource/dela-gothic-one/files/dela-gothic-one-latin-400-normal.woff2', 'dela-gothic-one-latin.woff2'],
];
for (const [origen, destino] of archivos) copyFileSync(join(nm, origen), join(fuentes, destino));

// nombre en el sistema → nombre del icono en Lucide
const ICONOS = {
    sol: 'sun',
    luna: 'moon',
    papelera: 'trash-2',
    cerrar: 'x',
    llave: 'wrench',
    ubicacion: 'map-pin',
    intercambio: 'arrow-left-right',
    incidencia: 'clipboard-list',
    cajas: 'boxes',
    flecha: 'arrow-right',
    usuarios: 'users',
    inicio: 'house',
    menu: 'menu',
    arriba: 'arrow-up',
    salir: 'log-out',
};

const cuerpos = Object.entries(ICONOS).map(([nombre, lucide]) => {
    const svg = readFileSync(join(nm, 'lucide-static/icons', `${lucide}.svg`), 'utf8');
    const interior = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
    return `    ${nombre}: '${interior}',`;
});

const modulo = `// GENERADO por scripts/vendor-assets.mjs desde lucide-static. No editar a mano.
const CUERPOS = {
${cuerpos.join('\n')}
};

export function icono(nombre, clase = '') {
    const cuerpo = CUERPOS[nombre];
    if (!cuerpo) return '';
    return \`<svg class="icono\${clase ? \` \${clase}\` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">\${cuerpo}</svg>\`;
}

// Reemplaza <i data-icon="nombre"></i> por el SVG. Idempotente.
export function hidratarIconos(raiz = document) {
    raiz.querySelectorAll('[data-icon]').forEach(el => {
        const svg = icono(el.dataset.icon, el.dataset.iconClass || '');
        if (!svg) return;
        const plantilla = document.createElement('template');
        plantilla.innerHTML = svg;
        const nuevo = plantilla.content.firstElementChild;
        for (const clase of el.classList) nuevo.classList.add(clase);
        if (el.hidden) nuevo.setAttribute('hidden', '');
        el.replaceWith(nuevo);
    });
}
`;
writeFileSync(join(raiz, 'src/shared/ui/icons.js'), modulo);
console.log('fuentes y iconos listos');
