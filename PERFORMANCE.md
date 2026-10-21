# Test de rendimiento — SGRSI

**Fecha:** 20/10/2026  
**Alcance:** frontend completo (login, dashboard, incidencias, solicitudes, inventario, préstamos, usuarios) + capa HTTP de la API.  
**Entorno:** Windows, Node 22, navegador integrado (Chromium), app servida en `http://localhost:8787`.

> **Importante:** no hay PHP instalado en este equipo y MariaDB usa otras credenciales/puerto, así que la API se midió contra un **mock con el mismo contrato JSON**, sin base de datos. Los tiempos de API son una referencia de la capa HTTP, no del backend real. Las métricas de render se midieron con el navegador integrado, que está en segundo plano y no pinta: por eso se usan *navigation timing*, *data-ready* y trazas del hilo principal en lugar de FCP/LCP.

## Resumen ejecutivo

| Métrica | Resultado |
|---|---|
| Request HTTP (Node, keep-alive) | **0,15–0,23 ms** promedio; p95 **0,18–0,30 ms** |
| Throughput mock (20 conexiones) | **6.500–11.300 req/s** |
| Fetch desde el navegador (secuencial) | **36,1 ms** promedio; p95 **55,7 ms** |
| Fetch desde el navegador (5 en paralelo) | **83,5 ms** promedio; p95 **110,7 ms** |
| DCL (DOMContentLoaded) | **304–485 ms** |
| Load | **360–541 ms** |
| Datos listos en pantalla | **384–614 ms** |
| Trabajo del hilo principal | **60–69 ms** por carga; tarea más larga **36 ms** |
| Layout + style | **1,4–3,5 ms** cada uno |
| Long tasks > 50 ms | **0** en las 6 trazas finales |
| Transferencia por página | **218–265 KB**, de los cuales **185 KB son el logo** |

**Conclusión:** el render es barato; el costo está en la red. Dos cuellos de botella claros:

1. **Waterfall de módulos ES**: 12–23 requests de JS por página, con profundidad 4–6. El DCL queda pegado al último módulo (≈360–483 ms).
2. **Logo de 185 KB** en todas las páginas: explica el 70–75 % de la transferencia y empuja el evento `load`.

## Metodología

- **API (Node):** 50 warmups + 300 requests secuenciales + 1.500 con concurrencia 20 por endpoint, conexiones keep-alive, midiendo hasta consumir el body.
- **Navegador:** 4 cargas por página con `Cache-Control: no-store` en los assets locales (peor caso), mismo perfil y misma sesión. Se registran `PerformanceNavigationTiming`, `PerformanceResourceTiming` y el momento en que la tabla/panel deja de mostrar “Cargando”.
- **Render:** una traza de Chromium por página (`browser.trace`) para medir `RunTask`, `Layout`, `UpdateLayoutTree`, `ParseHTML` y long tasks.
- **No se usó Lighthouse** para performance porque la integración disponible solo audita accesibilidad, SEO y buenas prácticas.

## 1. API — baseline HTTP (Node, keep-alive)

Mock sin PHP ni base de datos. Sirve para medir el costo de la capa HTTP y del contrato JSON.

| Endpoint | Avg seq. | p95 seq. | Avg conc. 20 | p95 conc. 20 | req/s conc. 20 | Bytes |
|---|---:|---:|---:|---:|---:|---:|
| `auth.php?accion=sesion` | 0,229 ms | 0,304 ms | 3,009 ms | 3,515 ms | 6.560 | 122 |
| `incidencias.php?accion=listar` | 0,187 ms | 0,233 ms | 2,508 ms | 3,133 ms | 7.915 | 605 |
| `solicitudes.php?accion=listar` | 0,173 ms | 0,240 ms | 2,084 ms | 2,818 ms | 9.526 | 565 |
| `inventario.php?accion=listar` | 0,159 ms | 0,199 ms | 1,831 ms | 2,186 ms | 10.849 | 501 |
| `inventario.php?accion=ubicaciones` | 0,155 ms | 0,194 ms | 1,769 ms | 2,000 ms | 11.233 | 236 |
| `prestamos.php?accion=listar` | 0,152 ms | 0,184 ms | 1,787 ms | 2,034 ms | 11.122 | 455 |
| `prestamos.php?accion=equipos` | 0,163 ms | 0,202 ms | 1,839 ms | 2,200 ms | 10.809 | 118 |
| `usuarios.php?accion=listar` | 0,148 ms | 0,182 ms | 1,835 ms | 2,206 ms | 10.813 | 391 |
| `usuarios.php?accion=tecnicos` | 0,149 ms | 0,185 ms | 1,748 ms | 2,034 ms | 11.362 | 160 |

## 2. Fetch desde el navegador

Mismo endpoint (`incidencias.php?accion=listar`), ya con conexiones calientes. Es lo que experimenta realmente la app en este entorno.

| Escenario | Avg | p50 | p95 | Min | Max |
|---|---:|---:|---:|---:|---:|
| Secuencial (100) | 36,1 ms | 34,8 ms | 55,7 ms | 8,6 ms | 74,8 ms |
| Ráfaga de 5 en paralelo (20) | 83,5 ms | 89,5 ms | 110,7 ms | 39,2 ms | 111,4 ms |
| Concurrencia 10 (300) | 125,5 ms | 124,6 ms | 169,9 ms | 27,0 ms | 253,5 ms |

La diferencia con Node (0,15 ms) es el costo de la pila de red del navegador y del loopback de Windows, no del servidor. En producción el RTT real será el que domine.

## 3. Carga y datos listos por página

Promedios de 4 cargas. Entre paréntesis, la mediana.

| Página | Módulos JS | Transfer | DCL | Load | API completada | UI con datos | Heap |
|---|---:|---:|---:|---:|---:|---:|---:|
| `index` (login) | 12 | 218,0 KB | 395 (300) ms | 476 (356) ms | — | 485 (366) ms | 8,5 MB |
| `sites/registro` | 12 | 218,0 KB | 304 (306) ms | 360 (360) ms | — | 384 (383) ms | 7,3 MB |
| `sites/principal` | 17 | 252,9 KB | 369 (360) ms | 427 (424) ms | 495 (497) ms | 504 (503) ms | 10,2 MB |
| `sites/incidencias` | 22 | 260,9 KB | 363 (371) ms | 411 (409) ms | 454 (451) ms | 471 (468) ms | 8,1 MB |
| `sites/servicio` | 23 | 264,7 KB | 436 (423) ms | 489 (484) ms | 533 (529) ms | 550 (545) ms | 8,6 MB |
| `sites/inventario` | 20 | 261,8 KB | 485 (447) ms | 541 (511) ms | 596 (573) ms | 614 (587) ms | 8,5 MB |
| `sites/prestamos` | 19 | 257,1 KB | 379 (387) ms | 432 (435) ms | 478 (469) ms | 496 (488) ms | 8,6 MB |
| `sites/admin_usuarios` | 17 | 247,8 KB | 422 (420) ms | 467 (456) ms | 481 (478) ms | 492 (493) ms | 8,6 MB |

**Data-ready vs API:** la UI aparece entre **8 y 18 ms después** de la última respuesta de API. El render posterior a los datos es rápido; la espera es de red.

## 4. Fase de API por página

Incluye `auth.php?accion=sesion` + las llamadas propias de cada pantalla.

| Página | Llamadas | Promedio por request | Máximo | Fase API total |
|---|---:|---:|---:|---:|
| `principal` | 6 | 68,1 ms | 93,6 ms | 125,5 ms |
| `incidencias` | 3 | 29,6 ms | 36,2 ms | 91,4 ms |
| `inventario` | 3 | 36,4 ms | 48,9 ms | 111,5 ms |
| `servicio` | 3 | 31,8 ms | 47,3 ms | 97,5 ms |
| `prestamos` | 3 | 31,9 ms | 43,2 ms | 99,4 ms |
| `admin_usuarios` | 2 | 28,6 ms | 36,0 ms | 58,5 ms |

En el dashboard las 5 consultas de datos salen en paralelo; la fase total (125 ms) es mucho menor que la suma de las 6 latencias.

## 5. Hilo principal y render

Traza de Chromium, ~1,5 s por página, incluyendo carga y render de datos.

| Página | RunTask total | Tarea más larga | Layout | Style | ParseHTML | Long tasks |
|---|---:|---:|---:|---:|---:|---:|
| login | 61,1 ms | 36,1 ms | 0,3 ms | 2,7 ms | 3,3 ms | 0 |
| principal | 63,8 ms | 14,8 ms | 3,5 ms | 3,2 ms | 2,8 ms | 0 |
| incidencias | 62,0 ms | 19,8 ms | 1,5 ms | 3,4 ms | 3,4 ms | 0 |
| inventario | 63,4 ms | 22,1 ms | 2,1 ms | 3,5 ms | 3,3 ms | 0 |
| prestamos | 68,7 ms | 27,3 ms | 1,5 ms | 3,4 ms | 3,2 ms | 0 |
| admin_usuarios | 59,9 ms | 22,8 ms | 1,4 ms | 2,4 ms | 3,2 ms | 0 |

No hay long tasks > 50 ms en estas corridas. El render no es el problema.

## 6. Peso y composición

| Recurso | Tamaño | Observación |
|---|---:|---|
| `src/shared/assets/logo.png` | **184,8 KB** | Se carga en todas las páginas; 70–75 % del transfer |
| `src/shared/assets/login-instituto.webp` | 162,7 KB | Solo fondo del login |
| CSS total | 34,7 KB | `layout.css` 21,9 KB, `tema.css` 7,3 KB, `componentes.css` 3,5 KB, `base.css` 1,2 KB |
| JS por página | 16,4–36,1 KB | 12–23 módulos, profundidad 4–6 |
| Bootstrap + Bootstrap Icons + Google Fonts + Unsplash | variable | Estaban cacheados en la prueba; el primer acceso puede sumar cientos de KB |

## Lectura de resultados

- **El backend mock no es el cuello de botella.** 0,15–0,23 ms por request en Node y 6.500–11.300 req/s con 20 conexiones.
- **El DCL está dominado por el waterfall de módulos.** En `principal`, el último módulo termina en 366,8 ms y el DCL ocurre en 369,1 ms. En `incidencias`, 360,3 ms y 362,6 ms. Es la misma historia en todas las páginas.
- **El `load` está dominado por imágenes.** El logo de 185 KB se descarga en todas las páginas y el fondo del login pesa 163 KB.
- **El render es barato.** 60–69 ms de trabajo total del hilo principal, layout/style de 1–4 ms y ninguna long task > 50 ms.
- **La UI aparece rápido después de los datos.** 8–18 ms entre la última respuesta y la tabla/panel renderizado.

## Limitaciones

1. **Sin PHP/MySQL reales:** los tiempos de API no incluyen conexión PDO, consultas, índices ni serialización PHP.
2. **Navegador en segundo plano:** `document.visibilityState === 'hidden'`, por lo que no hay FCP/LCP/CLS ni pintura real. Se compensó con navigation timing, data-ready y trazas del hilo principal.
3. **CDN cacheado:** Bootstrap, iconos y fuentes ya estaban en caché. No se midió el primer acceso en frío.
4. **Assets locales con `no-store`:** se midió el peor caso, sin cache del navegador.
5. **Sin throttling de red/CPU:** los valores son de loopback local, no de un usuario móvil.
6. **4 corridas por página:** los promedios son sensibles a outliers; por eso se muestra también la mediana.

## Recomendaciones priorizadas

1. **Bundlear el JS** (Vite, esbuild o Rollup). Pasar de 12–23 módulos a 1–2 archivos. Impacto esperado: recortar buena parte de los 300–480 ms de DCL.
2. **Optimizar el logo**: SVG o PNG/WebP de 64–128 px. Pasar de 185 KB a <15 KB. Impacto esperado: ahorro de ~170 KB por página y mejora directa del `load`.
3. **Cache de assets**: nombres con hash + `Cache-Control: public, max-age=31536000, immutable`. HTML con `no-cache`. Esto mejora muchísimo las visitas repetidas.
4. **Reducir dependencias externas**: self-host de Bootstrap/Icons, subset de iconos, `font-display: swap`, preload de fuentes y eliminar el fondo remoto de Unsplash.
5. **Medir la API real** con `scripts/perf/api-benchmark.mjs` cuando PHP/MySQL estén disponibles; agregar índices, paginación y gzip si hace falta.
6. **Presupuesto de performance**: DCL < 1 s, LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JS < 100 KB por página. Medirlo en CI.

## Reproducir

API contra el backend real:

```bash
PERF_BASE_URL="http://localhost/proyecto-dateminers/api/" \
PERF_COOKIE="PHPSESSID=..." \
node scripts/perf/api-benchmark.mjs
```

El script imprime JSON con avg, p50, p95, p99, min, max, req/s y bytes por endpoint. Ver `scripts/perf/README.md`.
