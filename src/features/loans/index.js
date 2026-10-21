// API pública de la feature loans.

export { initLoansPage } from './views/loans.view.js';
export { renderTablaPrestamos } from './components/loans-table.js';
export { accionesDisponibles } from './utils/loans.js';
export {
    listarEquiposDisponibles,
    listarPrestamos,
    crearPrestamo,
    actualizarEstadoPrestamo,
    eliminarPrestamo,
} from './services/loans.service.js';
