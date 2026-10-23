// Cliente de desarrollo. El plugin lo inyecta inline (script clásico, primero en <head>) solo en `bun dev`,
// con la configuración en window.__SGRSI_DEV__. Nunca llega al build.
//   1. Envuelve fetch: cada llamada a /api/ se loguea en la consola del navegador, agrupada y colapsada.
//   2. Panel flotante con el historial de llamadas (pedido, respuesta, estado, ms).
//   3. En modo mock, usuarios de prueba para entrar con un clic o completar el formulario de login.
(() => {
    const cfg = window.__SGRSI_DEV__;
    if (!cfg || window.__SGRSI_DEV_ACTIVO__) return;
    window.__SGRSI_DEV_ACTIVO__ = true;

    const MAX_LLAMADAS = 60;
    const llamadas = [];
    const oyentes = new Set();
    const avisar = () => oyentes.forEach(fn => fn());

    const enmascarar = valor => {
        if (!valor || typeof valor !== 'object') return valor;
        const copia = Array.isArray(valor) ? [...valor] : { ...valor };
        for (const clave of Object.keys(copia)) {
            if (/clave|password|token/i.test(clave)) copia[clave] = '********';
        }
        return copia;
    };

    function describirCuerpo(cuerpo) {
        if (cuerpo == null) return null;
        if (cuerpo instanceof FormData) {
            return enmascarar(Object.fromEntries([...cuerpo].map(([k, v]) => [k, typeof v === 'string' ? v : '[archivo]'])));
        }
        if (cuerpo instanceof URLSearchParams) return enmascarar(Object.fromEntries(cuerpo));
        if (typeof cuerpo === 'string') {
            try { return enmascarar(JSON.parse(cuerpo)); } catch { return cuerpo; }
        }
        return '[cuerpo no mostrable]';
    }

    const hora = () => new Date().toLocaleTimeString('es-UY', { hour12: false });
    const esExito = estado => estado >= 200 && estado < 400;

    function registrar(llamada) {
        llamadas.unshift(llamada);
        if (llamadas.length > MAX_LLAMADAS) llamadas.pop();
        avisar();
        if (!cfg.log) return;

        const etiqueta = 'background:#1a312c;color:#89d7b7;padding:1px 6px;border-radius:2px;font-weight:700';
        const color = llamada.estado === 0 ? '#dc2626' : esExito(llamada.estado) ? '#16a34a' : '#d97706';
        console.groupCollapsed(
            `%cAPI%c ${llamada.metodo} %c${llamada.ruta}%c ${llamada.estado || 'sin respuesta'} · ${llamada.ms} ms`,
            etiqueta, 'font-weight:700', 'font-weight:400', `color:${color};font-weight:700`,
        );
        if (cfg.bodies) {
            console.log('Pedido', llamada.pedido);
            console.log('Respuesta', llamada.respuesta);
        }
        if (llamada.error) console.error(llamada.error);
        console.groupEnd();
    }

    const fetchOriginal = window.fetch.bind(window);
    window.fetch = async (entrada, opciones) => {
        let url;
        try {
            url = new URL(typeof entrada === 'string' || entrada instanceof URL ? entrada : entrada.url, location.href);
        } catch {
            return fetchOriginal(entrada, opciones);
        }
        if (!url.pathname.includes('/api/')) return fetchOriginal(entrada, opciones);

        const metodo = String(opciones?.method || (typeof entrada === 'object' && entrada.method) || 'GET').toUpperCase();
        const ruta = url.pathname.replace(/^.*\/api\//, '') + url.search;
        const pedido = describirCuerpo(opciones?.body);
        const inicio = performance.now();
        try {
            const respuesta = await fetchOriginal(entrada, opciones);
            const copia = respuesta.clone();
            const textoRespuesta = await copia.text();
            let datos = textoRespuesta;
            try { datos = JSON.parse(textoRespuesta); } catch { /* respuesta que no es JSON: se muestra tal cual */ }
            registrar({ hora: hora(), metodo, ruta, estado: respuesta.status, ms: Math.round(performance.now() - inicio), pedido, respuesta: enmascarar(datos) });
            return respuesta;
        } catch (error) {
            registrar({ hora: hora(), metodo, ruta, estado: 0, ms: Math.round(performance.now() - inicio), pedido, respuesta: null, error });
            throw error;
        }
    };

    if (!cfg.panel) return;

    // ---------- panel ----------
    const CSS = `
        :host { all: initial; }
        * { box-sizing: border-box; }
        .raiz { position: fixed; right: 76px; bottom: 20px; z-index: 2147483000; font: 12px/1.4 var(--font-mono, ui-monospace, Menlo, monospace); color: var(--cream, #fff4e1); }
        button { font: inherit; color: inherit; cursor: pointer; border: 1px solid #5a9c8c; border-radius: 2px; background: transparent; padding: 4px 8px; }
        button:hover { background: #24463e; }
        button:focus-visible { outline: 2px solid #89d7b7; outline-offset: 2px; }
        .pastilla { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; background: #1a312c; border: 2px solid #89d7b7; border-radius: 2px; font-weight: 600; }
        .pastilla b { color: #89d7b7; }
        .panel { position: absolute; right: 0; bottom: 52px; width: min(440px, calc(100vw - 96px)); max-height: 60vh; display: flex; flex-direction: column; background: #142723; border: 2px solid #89d7b7; border-radius: 6px; overflow: hidden; }
        .panel[hidden] { display: none; }
        .barra { display: flex; align-items: center; gap: 6px; padding: 8px; border-bottom: 1px solid #2e4d46; }
        .barra .espacio { flex: 1; }
        .pestana[aria-selected='true'] { background: #89d7b7; color: #1a312c; border-color: #89d7b7; }
        .cuerpo { overflow: auto; padding: 4px 0; }
        .vacio { padding: 16px; color: #b9c9bf; }
        .fila { display: grid; grid-template-columns: 58px 44px 1fr auto; gap: 8px; align-items: baseline; width: 100%; padding: 6px 10px; border: 0; border-radius: 0; text-align: left; }
        .fila .ruta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ok { color: #89d7b7; } .avisoe { color: #f2c46d; } .mal { color: #f2a38f; } .tenue { color: #b9c9bf; }
        pre { margin: 0; padding: 8px 10px 10px; background: #0e1d1a; border-top: 1px solid #2e4d46; overflow: auto; max-height: 220px; white-space: pre-wrap; word-break: break-word; }
        .usuario { display: flex; align-items: center; gap: 8px; padding: 6px 10px; }
        .usuario .datos { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rol { padding: 1px 6px; border: 1px solid #5a9c8c; border-radius: 2px; color: #89d7b7; }
        .nota { padding: 8px 10px; color: #b9c9bf; border-top: 1px solid #2e4d46; }
    `;

    const esc = valor => String(valor).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const clase = estado => (estado === 0 || estado >= 500 ? 'mal' : esExito(estado) ? 'ok' : 'avisoe');
    const guardar = (clave, valor) => { try { sessionStorage.setItem(clave, valor); } catch { /* sin almacenamiento */ } };
    const leer = clave => { try { return sessionStorage.getItem(clave); } catch { return null; } };

    function montar() {
        const anfitrion = document.createElement('div');
        anfitrion.id = 'sgrsi-dev';
        const sombra = anfitrion.attachShadow({ mode: 'open' });
        document.documentElement.append(anfitrion);

        const hayUsuarios = cfg.modo === 'mock' && Array.isArray(cfg.usuarios) && cfg.usuarios.length > 0;
        const estado = { abierto: leer('sgrsi-dev-abierto') === '1', pestana: leer('sgrsi-dev-pestana') || 'llamadas', expandida: null };
        if (estado.pestana === 'usuarios' && !hayUsuarios) estado.pestana = 'llamadas';

        function pintar() {
            const ultima = llamadas[0];
            const modo = cfg.modo === 'mock' ? 'mock' : `proxy`;
            const cuerpo = estado.pestana === 'usuarios' ? vistaUsuarios() : vistaLlamadas();
            sombra.innerHTML = `<style>${CSS}</style>
                <div class="raiz">
                    <div class="panel" ${estado.abierto ? '' : 'hidden'} role="dialog" aria-label="Panel de desarrollo">
                        <div class="barra">
                            <button class="pestana" data-pestana="llamadas" role="tab" aria-selected="${estado.pestana === 'llamadas'}">Llamadas</button>
                            ${hayUsuarios ? `<button class="pestana" data-pestana="usuarios" role="tab" aria-selected="${estado.pestana === 'usuarios'}">Usuarios</button>` : ''}
                            <span class="espacio"></span>
                            <button data-accion="limpiar" aria-label="Vaciar historial">Vaciar</button>
                            <button data-accion="cerrar" aria-label="Cerrar panel">Cerrar</button>
                        </div>
                        <div class="cuerpo">${cuerpo}</div>
                        <div class="nota">API ${modo}${cfg.modo === 'proxy' && cfg.target ? ` → ${esc(cfg.target)}` : ''}</div>
                    </div>
                    <button class="pastilla" data-accion="alternar" aria-expanded="${estado.abierto}" aria-label="Panel de desarrollo, ${llamadas.length} llamadas">
                        <b>DEV</b> ${modo}
                        <span class="${ultima ? clase(ultima.estado) : 'tenue'}">${llamadas.length}</span>
                    </button>
                </div>`;
        }

        function vistaLlamadas() {
            if (!llamadas.length) return '<div class="vacio">Todavía no hubo llamadas a la API.</div>';
            return llamadas.map((l, i) => {
                const abierta = estado.expandida === i;
                const detalle = abierta
                    ? `<pre>${esc(JSON.stringify({ pedido: l.pedido, respuesta: l.respuesta }, null, 2))}</pre>`
                    : '';
                return `<button class="fila" data-llamada="${i}" aria-expanded="${abierta}">
                    <span class="tenue">${esc(l.hora)}</span><b>${esc(l.metodo)}</b>
                    <span class="ruta" title="${esc(l.ruta)}">${esc(l.ruta)}</span>
                    <span class="${clase(l.estado)}">${l.estado || 'x'} · ${l.ms} ms</span>
                </button>${detalle}`;
            }).join('');
        }

        function vistaUsuarios() {
            const filas = cfg.usuarios.map((u, i) => `<div class="usuario">
                <span class="rol">${esc(u.rol)}</span>
                <span class="datos" title="${esc(u.correo)}">${esc(u.nombre)}${u.activo ? '' : ' (inactivo)'}</span>
                <button data-usuario="${i}" data-modo="completar" aria-label="Completar el formulario con ${esc(u.nombre)}">Completar</button>
                <button data-usuario="${i}" data-modo="entrar" aria-label="Entrar como ${esc(u.nombre)}" ${u.activo ? '' : 'disabled'}>Entrar</button>
            </div>`).join('');
            return `${filas}<div class="nota">Contraseña de todos: ${esc(cfg.clavePrueba)}</div>`;
        }

        async function entrarComo(usuario) {
            const campos = new FormData();
            campos.append('correo', usuario.correo);
            campos.append('clave', usuario.clave);
            const respuesta = await window.fetch('/api/auth.php?accion=login', { method: 'POST', body: campos });
            if (!respuesta.ok) return;
            try { sessionStorage.removeItem('usuario'); } catch { /* sin almacenamiento */ }
            location.reload();
        }

        function completarOEntrar(usuario, modo) {
            const correo = document.getElementById('correo');
            const clave = document.getElementById('clave');
            if (correo && clave) {
                correo.value = usuario.correo;
                clave.value = usuario.clave;
                if (modo === 'entrar' && typeof window.login === 'function') window.login();
                return;
            }
            if (modo === 'entrar') entrarComo(usuario);
        }

        sombra.addEventListener('click', evento => {
            const objetivo = evento.target.closest('button');
            if (!objetivo) return;
            const { accion, pestana, llamada, usuario, modo } = objetivo.dataset;
            if (accion === 'alternar') { estado.abierto = !estado.abierto; guardar('sgrsi-dev-abierto', estado.abierto ? '1' : '0'); }
            else if (accion === 'cerrar') { estado.abierto = false; guardar('sgrsi-dev-abierto', '0'); }
            else if (accion === 'limpiar') { llamadas.length = 0; estado.expandida = null; }
            else if (pestana) { estado.pestana = pestana; guardar('sgrsi-dev-pestana', pestana); }
            else if (llamada !== undefined) { estado.expandida = estado.expandida === Number(llamada) ? null : Number(llamada); }
            else if (usuario !== undefined) { completarOEntrar(cfg.usuarios[Number(usuario)], modo); return; }
            pintar();
        });
        sombra.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && estado.abierto) { estado.abierto = false; guardar('sgrsi-dev-abierto', '0'); pintar(); }
        });

        oyentes.add(pintar);
        pintar();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
