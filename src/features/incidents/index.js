// API pública de la feature incidents.

export { initIncidentsPage } from './views/incidents.view.js';
export { renderTablaIncidencias } from './components/incidents-table.js';
export { formatEstadoIncidencia } from './utils/incidents.js';
export {
    listarIncidencias,
    crearIncidencia,
    actualizarEstadoIncidencia,
    asignarTecnicoIncidencia,
    cambiarPrioridadIncidencia,
    eliminarIncidencia,
} from './services/incidents.service.js';
