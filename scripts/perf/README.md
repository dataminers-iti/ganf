# Performance

## Benchmark de API

Con el proyecto servido por Apache/XAMPP y una sesión válida:

```bash
PERF_BASE_URL="http://localhost/proyecto-dateminers/api/" \
PERF_COOKIE="PHPSESSID=..." \
node scripts/perf/api-benchmark.mjs
```

`PERF_COOKIE` es necesario para los endpoints que exigen sesión. Se puede copiar
desde DevTools → Application → Cookies, o desde `document.cookie` en la consola.

Variables opcionales:

| Variable | Default | Descripción |
|---|---:|---|
| `PERF_SEQ` | 300 | Requests secuenciales por endpoint |
| `PERF_CONC` | 1500 | Requests totales en concurrencia |
| `PERF_CONCURRENCY` | 20 | Workers simultáneos |
| `PERF_WARMUP` | 50 | Requests de calentamiento |

El resultado es JSON con `avg`, `p50`, `p95`, `p99`, `min`, `max`, `rps`,
`bytes` y cantidad de errores por endpoint.

## Métricas del navegador

Para medir una página desde DevTools (Console), después de que los datos estén
renderizados:

```js
const nav = performance.getEntriesByType('navigation')[0];
const res = performance.getEntriesByType('resource');
const api = res.filter(r => new URL(r.name).pathname.startsWith('/api/'));

console.table({
  ttfb: +(nav.responseStart - nav.startTime).toFixed(1),
  domContentLoaded: +nav.domContentLoadedEventEnd.toFixed(1),
  load: +nav.loadEventEnd.toFixed(1),
  apiUltimaRespuesta: Math.max(...api.map(r => r.responseEnd)),
  apiPromedio: api.reduce((t, r) => t + (r.responseEnd - r.startTime), 0) / api.length,
  requests: res.length,
  transferKB: res.reduce((t, r) => t + (r.transferSize || 0), 0) / 1024,
});
```

Para una medición más fina del hilo principal, usar la pestaña Performance de
DevTools o `browser.trace` en el entorno de desarrollo.

## Resultados de referencia

Ver [`PERFORMANCE.md`](../../PERFORMANCE.md). Esa corrida se hizo contra un mock
de la API (sin PHP/MySQL) y con el navegador en segundo plano, por lo que no
incluye FCP/LCP/CLS.
