// API pública de la feature inventory.

export { initInventoryPage } from './views/inventory.view.js';
export { renderTablaEquipos } from './components/inventory-table.js';
export { renderTablaUbicaciones, renderOpcionesUbicaciones } from './components/locations-table.js';
export { formatEstadoEquipo } from './utils/inventory.js';
export { listarEquipos, guardarEquipo, eliminarEquipo } from './services/inventory.service.js';
export { listarUbicaciones, crearUbicacion, eliminarUbicacion } from './services/locations.service.js';
