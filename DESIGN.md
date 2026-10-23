# Design

Extiende el design system de Dataminers (https://claude.ai/artifact/C4aWDMadQWA1p9gsodtNra), que a su vez extiende la
casa WeFaber. Aquí solo van las desviaciones y lo propio de SGRSI. Implementación de referencia de los tokens:
`dataminers-site/src/index.css`.

Tema: Dataminers (verde profundo / vena / menta / crema). Claro y oscuro, sigue al sistema, el interruptor se guarda en
`localStorage` (`dm-theme`) y el script del `<head>` fija `data-theme` antes de pintar.

## Stack (desviación de la casa)

SGRSI es HTML + CSS + JS vanilla sobre una API PHP, sin bundler y sin React ni Tailwind. El design system se aplica con
los **mismos nombres de rol** como custom properties, no con utilidades de Tailwind. Migrar el stack no es parte de
esta adaptación.

- Tokens: `src/shared/styles/tokens.css`. Nunca colores sueltos en otro CSS ni en JS: solo `var(--rol)`.
- Fuentes self-hosted en `src/shared/fonts/` (Dela Gothic One, Valley Sans, Merriweather, JetBrains Mono). Sin CDN.
- Iconos: Lucide, desde `src/shared/ui/icons.js` (generado). En HTML estático `<i data-icon="nombre"></i>`; en plantillas JS
  `icono('nombre')`. Sin Bootstrap ni Bootstrap Icons.
- `bun run vendor` regenera fuentes e iconos desde `node_modules` (`bun install` antes). Para un icono nuevo, agregarlo al
  mapa de `scripts/vendor-assets.mjs`.

## Principios propios

- Herramienta interna de gestión: contenido primero, nada decorativo. La metáfora minera no se usa en SGRSI.
- Menta (`accent`) es escasa: acción primaria, ítem activo del menú, selección. Nunca texto sobre superficie clara.
- Sin movimiento ambiental. Hover 120 ms, panel 180 ms. `prefers-reduced-motion` desactiva traslaciones.
- Un solo botón primario por área. Todo `<button>` es primario por defecto; las variantes lo reducen.
- La pantalla de acceso (login y registro) es la única superficie pública: pantalla dividida con la foto del instituto.

## Roles de color

| Rol | Token | Uso en SGRSI |
|---|---|---|
| lienzo | `surface` | fondo de página y topbar |
| tarjeta | `surface-raised` | tarjetas, tablas, diálogos |
| hundido | `surface-sunken` | campos, cabecera de tabla |
| texto | `ink`, `ink-muted` | contenido, ayudas |
| filete | `line`, `line-strong` | separadores, bordes de controles (>=3:1) |
| enlace | `brand-strong` | enlaces, etiquetas superiores |
| primaria | `accent` / `on-accent` | botón primario, ítem activo |
| peligro | `danger` | errores, borrar, estados negativos |
| fijos | `deep`, `cream` | sidebar, panel de bienvenida |

## Estados (etiquetas `.badge`)

El color nunca va solo: la etiqueta siempre dice el estado. Cuatro tonos, por significado.

| Tono | Estados |
|---|---|
| danger (borde) | prioridad alta, de baja, cerrada, rechazada, inactivo |
| brand (tinte) | media, en reparación, en proceso, solicitado, pendiente, aprobado |
| accent (relleno menta) | baja, activo, resuelta, completada, devuelto |
| ink (relleno oscuro) | abierta, entregado |

## Layout

Sidebar fija sobre `deep` (riel de iconos bajo 900 px, cajón bajo 650 px) · topbar pegajosa · contenido centrado, máx.
1320 px, crece primero en X (tablas con desplazamiento horizontal) · botón de volver arriba pasada la primera pantalla.
En el panel, una sola tarjeta destacada (`shadow-block`).

## Radios

`--radius-sm` 2 px (botones, etiquetas, campos) · `--radius-md` 6 px (tarjetas, tablas) · `--radius-lg` 12 px (diálogos,
panel de bienvenida, tarjeta de acceso).

## Checklist de pantalla nueva

- [ ] Solo `var(--rol)`; nada de hex ni de `style=` de apariencia (el `display:none` que alterna JS sí vale).
- [ ] Iconos con `data-icon` o `icono()`.
- [ ] Texto en voseo rioplatense, sin signos de exclamación, sin rayas largas (se usa `-`).
- [ ] Probada en claro y oscuro, y a 375 px.
