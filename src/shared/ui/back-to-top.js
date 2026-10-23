// Botón de volver arriba: aparece pasada la primera pantalla y se oculta al volver.
// Usa IntersectionObserver sobre un centinela, sin escuchar el evento scroll.

import { icono } from './icons.js';

export function montarVolverArriba() {
    if (document.querySelector('.volver-arriba')) return;

    const centinela = document.createElement('div');
    centinela.setAttribute('aria-hidden', 'true');
    centinela.style.cssText = 'position:absolute;top:100dvh;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.append(centinela);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'volver-arriba';
    boton.hidden = true;
    boton.setAttribute('aria-label', 'Volver arriba');
    boton.innerHTML = icono('arriba');
    boton.addEventListener('click', () => {
        const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' });
    });
    document.body.append(boton);

    new IntersectionObserver(([entrada]) => {
        boton.hidden = entrada.isIntersecting || entrada.boundingClientRect.top > 0;
    }).observe(centinela);
}
