// API pública de la feature service-requests.

export { initServiceRequestsPage } from './views/service-requests.view.js';
export { renderTablaSolicitudes } from './components/service-requests-table.js';
export { formatEstadoSolicitud } from './utils/service-requests.js';
export {
    listarSolicitudes,
    crearSolicitud,
    actualizarEstadoSolicitud,
    asignarTecnicoSolicitud,
    cambiarPrioridadSolicitud,
    eliminarSolicitud,
} from './services/service-requests.service.js';
