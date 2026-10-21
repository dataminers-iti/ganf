# SGRSI · ITI

Sistema de Gestión de Recursos y Servicios Informáticos. Frontend en JavaScript
vanilla (ES modules, sin bundler) + API PHP en `api/`.

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
scripts/perf/                   # Benchmark HTTP de la API
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
    ├── theme/theme.js          # Tema claro/oscuro
    ├── utils/format.js         # Fechas, recortes, capitalización
    ├── styles/                 # CSS global
    └── assets/                 # Logo e imágenes
```

### Routing

Las rutas se definen una sola vez en `src/shared/config/paths.js`:

- `RUTAS` contiene URLs absolutas (`login`, `panel`, `incidencias`, ...).
- `rutaApi()` resuelve los endpoints de `api/`.
- Ambas se calculan desde `import.meta.url`, por lo que funcionan igual si la
  app se sirve en la raíz del dominio o dentro de un subdirectorio.

`src/app/routes.js` expone `irAPagina()` y los helpers `mostrarLogin()`,
`mostrarPrincipal()`, etc. El layout y las redirecciones de auth usan esas
rutas; no hay rutas de página hardcodeadas en las features.


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

El proyecto necesita un servidor HTTP (los ES modules no funcionan con
`file://`). Con XAMPP/Apache, serví la carpeta del proyecto y abrí:

```
http://localhost/proyecto-dateminers/index.html
```

La API PHP requiere la base de datos `sgrsi_db` (ver `setup.sql`).

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
| `base.css`, `tema.css`, `componentes.css`, `layout.css` | `shared/styles/`         |
| `ico logo.png`          | `shared/assets/logo.png`                           |
| `login-instituto.webp`  | `shared/assets/login-instituto.webp`               |
