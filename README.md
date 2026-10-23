# SGRSI · ITI

Sistema de Gestión de Recursos y Servicios Informáticos. Frontend en JavaScript
vanilla (ES modules) empaquetado con **Vite MPA** + API PHP en `api/`.

## Estructura

El código está organizado por **features** (vertical slices). Cada feature es
autocontenida y expone su API pública desde `index.js`.

```
index.html                      # Entrada / login (única página en la raíz)
sites/                          # Resto de páginas HTML
├── principal.html
├── incidencias.html
├── servicio.html
├── inventario.html
├── prestamos.html
├── admin_usuarios.html
├── registro.html
└── sistema.html
api/                            # Backend PHP (endpoint por dominio)
vite.config.js                  # Build MPA: una entrada por página HTML
scripts/perf/                   # Benchmark HTTP de la API
dist/                           # Salida del build (no se versiona)
PERFORMANCE.md                  # Último informe de rendimiento
src/
├── app/                        # Composición de la aplicación
│   ├── entries/                # Una entrada JS por página HTML
│   │   ├── login.page.js
│   │   ├── dashboard.page.js
│   │   ├── incidents.page.js
│   │   └── ...
│   ├── layout.js               # Shell: sidebar, topbar, contenido
│   └── routes.js               # Navegación por rutas con nombre
├── features/
│   ├── auth/                   # Login, registro, sesión, roles
│   │   ├── services/
│   │   ├── views/
│   │   ├── session.js
│   │   └── index.js
│   ├── dashboard/              # Panel principal y estadísticas
│   ├── incidents/              # Incidencias
│   ├── service-requests/       # Solicitudes de servicio
│   ├── inventory/              # Equipos y ubicaciones
│   ├── loans/                  # Préstamos de equipos
│   └── user-admin/             # Usuarios y técnicos
└── shared/                     # Solo lo transversal y reutilizado
    ├── api/http.js             # Cliente HTTP + ApiError
    ├── config/paths.js         # Rutas de páginas + base de la API
    ├── dom/dom.js              # escapeHtml, mostrarError, limpiarCampo
    ├── ui/dialog.js            # Diálogos de confirmación / prioridad
    ├── ui/icons.js             # Iconos Lucide (generado: bun run vendor)
    ├── ui/back-to-top.js       # Botón de volver arriba
    ├── fonts/                  # Fuentes self-hosted (Dataminers)
    ├── theme/theme.js          # Tema claro/oscuro
    ├── utils/format.js         # Fechas, recortes, capitalización
    ├── styles/                 # CSS por capas: tokens, base, tema, componentes, layout/, entradas/
    └── assets/                 # Logo e imágenes
```

### Routing

Las rutas se definen una sola vez en `src/shared/config/paths.js`:

- `RUTAS` contiene URLs absolutas (`login`, `panel`, `incidencias`, ...).
- `rutaApi()` resuelve los endpoints de `api/`.
- La raíz se deduce del documento actual (raíz o `sites/`), así funciona igual
  servida en la raíz del dominio, en un subdirectorio (XAMPP) o empaquetada
  con Vite, donde el módulo termina dentro de `/assets/`.

`src/app/routes.js` expone `irAPagina()` y los helpers `mostrarLogin()`,
`mostrarPrincipal()`, etc. El layout y las redirecciones de auth usan esas
rutas; no hay rutas de página hardcodeadas en las features.

### CSS por capas

Los estilos viven en `src/shared/styles/`. `entradas/` concentra los `@import`
de cada tipo de página y es lo único que enlazan los HTML; Vite los empaqueta
en **un solo CSS minificado por página**.

| Archivo | Contenido |
| --- | --- |
| `tokens.css` | `@font-face` y tokens de color/tipografía (claro y oscuro) |
| `base.css` | Reset, tipografía, campos y botón primario |
| `tema.css` | Botón de tema y volver arriba |
| `componentes.css` | Tarjetas, tablas, etiquetas, variantes de botón y diálogos |
| `layout/login.css` | Login y registro |
| `layout/app-shell.css` | Sidebar, topbar y contenido |
| `layout/dashboard.css` | Panel principal |
| `layout/incidencias.css` | Formulario y listado de incidencias |
| `entradas/publicas.css` | tokens + base + tema + componentes + login |
| `entradas/internas.css` | tokens + base + tema + componentes + shell |
| `entradas/dashboard.css` | internas + dashboard |
| `entradas/incidencias.css` | internas + incidencias |

Regla: si un estilo lo usan 2+ páginas va en una capa global; si es de una
sola pantalla va en `layout/<pantalla>.css`. El orden de los `@import` es el
orden de la cascada.


### Anatomía de una feature

```
features/<feature>/
├── components/     # Renderizadores de UI (devuelven HTML)
├── services/       # Llamadas a la API
├── utils/          # Lógica pura (testeable sin DOM)
├── views/          # Controladores de página: estado + eventos
├── types.js        # Tipos JSDoc del dominio
├── index.js        # API pública de la feature
└── *.test.js       # Tests colocados junto al código
```

## Reglas de dependencia

1. `app` → `features` → `shared`.
2. Una feature **no** importa archivos internos de otra: solo su `index.js`.
   Por ejemplo, `incidents` usa `listarTecnicos` desde `features/user-admin`.
3. Un módulo se mueve a `shared/` solo cuando lo usan 2+ features.
4. `shared/` no importa features.
5. Los tests de `utils/` no tocan el DOM.

### Puente con el HTML

Las plantillas usan `onclick="..."`. Ese código corre en el scope global, por lo
que cada feature publica sus handlers en `window` dentro de su `init...Page()`
(o en `bindAuthGlobals()` / `bindNavigationGlobals()`). Es el único acoplamiento
deliberado con el HTML existente.

## Cómo ejecutar

Desarrollo (Vite):

```bash
bun install      # o npm install
bun run dev      # http://localhost:5173
```

Build de producción (deja todo en `dist/`, incluida la API PHP en `dist/api/`):

```bash
bun run build
bun run preview  # revisa el build en http://localhost:4173
```

Despliegue: copia el contenido de `dist/` a la carpeta que sirve Apache, en la
raíz del dominio o en un subdirectorio. Las URLs del build son relativas
(`base: './'`), así que no hace falta configurar nada más. La API PHP requiere
la base `sgrsi_db` (ver `setup.sql`).

### Modo desarrollo (`bun dev`)

`bun dev` es alias de `bun run dev`. Vite no ejecuta PHP, así que el servidor
trae su propia capa de API (`scripts/dev/`, solo con `serve`; nunca entra al
build):

- **Variables en `.dev`** (formato dotenv, fuera de git). Si no existe, se crea
  copiando `.dev.example`, que documenta cada variable. Una variable de entorno
  con el mismo nombre pisa al archivo.
- **`API_MODE=mock`** (por defecto): `/api/*.php` responde desde memoria con el
  mismo contrato `{status, message, data}`, los mismos roles y los mismos
  mensajes de error. No hace falta PHP ni MySQL. Contraseña de todos los
  usuarios de prueba: `dev1234` (`admin@iti.dev`, `tecnico@iti.dev`,
  `solicitante@iti.dev`, `usuario@iti.dev`). Los datos se reinician con el
  servidor.
- **`API_MODE=proxy`** con `API_TARGET=http://localhost/proyecto-dateminers`:
  reenvía `/api` al backend real (`VITE_API_PROXY` sigue valiendo como alias).
- **Llamadas visibles**: cada request a `/api/` se loguea en la terminal
  (`[api] GET auth.php?accion=sesion 200 4ms mock`) y en la consola del
  navegador (grupo "API" con pedido y respuesta; las claves salen enmascaradas).
  Un panel flotante abajo a la derecha lista las últimas 60 llamadas y, en mock,
  permite entrar con un usuario de prueba. `DEV_PANEL=false` lo apaga.
- `API_LATENCY_MS` simula red lenta; `API_LOG=false` silencia los logs.

## Tests

Los tests usan el runner nativo de Node (sin dependencias):

```bash
npm test
```

Cubren la lógica pura de `shared/utils`, `shared/dom`, `shared/api`, auth,
dashboard, incidencias, solicitudes, inventario y préstamos.

## Performance

El informe de la última medición está en [`PERFORMANCE.md`](PERFORMANCE.md):
tiempos de API, carga por página, data-ready y trabajo del hilo principal.

Para repetir el benchmark de API contra el backend real:

```bash
PERF_BASE_URL="http://localhost/proyecto-dateminers/api/" \
PERF_COOKIE="PHPSESSID=..." \
node scripts/perf/api-benchmark.mjs
```

Ver [`scripts/perf/README.md`](scripts/perf/README.md).

## Mapa de la migración

| Antes                   | Ahora                                              |
| ----------------------- | -------------------------------------------------- |
| `autenticacion.js`      | `features/auth/`                                   |
| `navegacion.js`         | `app/layout.js` + `app/routes.js`                  |
| `inicio.js`             | `features/dashboard/`                              |
| `incidencias.js`        | `features/incidents/`                              |
| `servicio.js`           | `features/service-requests/`                       |
| `inventario.js`         | `features/inventory/`                              |
| `prestamos.js`          | `features/loans/`                                  |
| `admin_usuarios.js`     | `features/user-admin/`                             |
| `dialogos.js`           | `shared/ui/dialog.js`                              |
| `tema.js`               | `shared/theme/theme.js`                            |
| `base.css`, `tema.css`, `componentes.css`, `layout.css` | `shared/styles/` (capas + `entradas/` para Vite) |
| `ico logo.png`          | `shared/assets/logo.webp`                          |
| `login-instituto.webp`  | `shared/assets/login-instituto.webp`               |
