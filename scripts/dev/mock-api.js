// API simulada en memoria para `bun dev` con API_MODE=mock. Reproduce el contrato de api/*.php:
// { status: 'exito' | 'error', message, data }, mismos campos, mismos roles y mismos mensajes de validación.
// Los datos viven en el proceso: al reiniciar el servidor vuelven al estado inicial.
// No se incluye en el build: solo lo importa el plugin de desarrollo.

export const CLAVE_DEV = 'dev1234';

const ROLES = ['admin', 'solicitante', 'tecnico', 'usuario'];
const PRIORIDADES = ['alta', 'media', 'baja'];
const TIPOS_UBICACION = ['laboratorio', 'salon', 'administracion', 'otro'];

const pad = n => String(n).padStart(2, '0');
function fecha(offsetDias = 0) {
    const d = new Date(Date.now() - offsetDias * 86400000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function datosIniciales() {
    return {
        sesion: null,
        sig: { usuarios: 8, incidencias: 5, solicitudes: 5, inventario: 5, ubicaciones: 5, prestamos: 5 },
        usuarios: [
            { id: 1, nombre: 'Facundo Presa', correo: 'admin@iti.dev', clave: CLAVE_DEV, rol: 'admin', activo: 1, fecha_creacion: fecha(40) },
            { id: 2, nombre: 'Rodrigo Sosa', correo: 'tecnico@iti.dev', clave: CLAVE_DEV, rol: 'tecnico', activo: 1, fecha_creacion: fecha(32) },
            { id: 3, nombre: 'Valentina Rocha', correo: 'solicitante@iti.dev', clave: CLAVE_DEV, rol: 'solicitante', activo: 1, fecha_creacion: fecha(25) },
            { id: 4, nombre: 'Lucía Techera', correo: 'usuario@iti.dev', clave: CLAVE_DEV, rol: 'usuario', activo: 1, fecha_creacion: fecha(18) },
            { id: 5, nombre: 'Matías Olivera', correo: 'molivera@iti.dev', clave: CLAVE_DEV, rol: 'tecnico', activo: 1, fecha_creacion: fecha(14) },
            { id: 6, nombre: 'Camila Ferreira', correo: 'cferreira@iti.dev', clave: CLAVE_DEV, rol: 'usuario', activo: 0, fecha_creacion: fecha(9) },
            { id: 7, nombre: 'Gonzalo Píriz', correo: 'gpiriz@iti.dev', clave: CLAVE_DEV, rol: 'solicitante', activo: 1, fecha_creacion: fecha(5) },
        ],
        ubicaciones: [
            { id: 1, nombre: 'Laboratorio A', tipo: 'laboratorio', edificio: 'ITI', piso: '1', referencia: 'Ala norte', activa: 1 },
            { id: 2, nombre: 'Laboratorio B', tipo: 'laboratorio', edificio: 'ITI', piso: '1', referencia: 'Ala sur', activa: 1 },
            { id: 3, nombre: 'Salón 3', tipo: 'salon', edificio: 'ITI', piso: '2', referencia: null, activa: 1 },
            { id: 4, nombre: 'Secretaría', tipo: 'administracion', edificio: 'ITI', piso: 'PB', referencia: 'Entrada principal', activa: 1 },
        ],
        inventario: [
            { id: 1, nombre: 'Notebook Lenovo L14', tipo: 'Computadora', marca: 'Lenovo', modelo: 'ThinkPad L14', numero_serie: 'PF3K82QD', estado: 'activo', ubicacion_id: 1, descripcion: '', cantidad: 12 },
            { id: 2, nombre: 'Monitor Dell 24', tipo: 'Monitor', marca: 'Dell', modelo: 'P2422H', numero_serie: 'CN0M7T91', estado: 'en_reparacion', ubicacion_id: 2, descripcion: 'Líneas verticales', cantidad: 3 },
            { id: 3, nombre: 'Impresora HP LaserJet', tipo: 'Impresora', marca: 'HP', modelo: 'M404dn', numero_serie: 'VNB3R24471', estado: 'de_baja', ubicacion_id: 4, descripcion: '', cantidad: 1 },
            { id: 4, nombre: 'Proyector Epson X49', tipo: 'Otro', marca: 'Epson', modelo: 'X49', numero_serie: 'X4TK900311', estado: 'activo', ubicacion_id: 3, descripcion: '', cantidad: 2 },
        ],
        incidencias: [
            { id: 1, titulo: 'Proyector del salón 3 no enciende', descripcion: 'Se conecta el cable HDMI y no aparece señal. Luz roja fija.', area: 'Salón 3', equipo_id: 4, prioridad: 'alta', estado: 'abierta', reportado_por: 4, asignado_a: null, fecha_creacion: fecha(0) },
            { id: 2, titulo: 'Sin internet en laboratorio B', descripcion: 'Las 12 computadoras pierden la red cada pocos minutos.', area: 'Laboratorio B', equipo_id: null, prioridad: 'media', estado: 'en_proceso', reportado_por: 3, asignado_a: 2, fecha_creacion: fecha(1) },
            { id: 3, titulo: 'Teclado con teclas trabadas', descripcion: 'Secretaría, puesto 2.', area: 'Secretaría', equipo_id: null, prioridad: 'baja', estado: 'resuelta', reportado_por: 4, asignado_a: 2, fecha_creacion: fecha(3) },
            { id: 4, titulo: 'Impresora de dirección atascada', descripcion: 'Papel trabado en la bandeja trasera.', area: 'Dirección', equipo_id: 3, prioridad: 'media', estado: 'cerrada', reportado_por: 7, asignado_a: 5, fecha_creacion: fecha(6) },
        ],
        solicitudes: [
            { id: 1, tipo_servicio: 'Instalación de software', descripcion: 'Instalar Packet Tracer en laboratorio A.', prioridad: 'media', estado: 'pendiente', solicitante_id: 3, tecnico_id: 2, fecha_creacion: fecha(0) },
            { id: 2, tipo_servicio: 'Cambio de monitor', descripcion: 'Monitor con líneas verticales.', prioridad: 'alta', estado: 'en_proceso', solicitante_id: 7, tecnico_id: 2, fecha_creacion: fecha(2) },
            { id: 3, tipo_servicio: 'Backup de equipo', descripcion: 'Antes de formatear la notebook.', prioridad: 'baja', estado: 'completada', solicitante_id: 3, tecnico_id: 5, fecha_creacion: fecha(5) },
            { id: 4, tipo_servicio: 'Acceso a wifi', descripcion: 'Alta de docente nuevo.', prioridad: 'baja', estado: 'rechazada', solicitante_id: 7, tecnico_id: null, fecha_creacion: fecha(7) },
        ],
        prestamos: [
            { id: 1, usuario_id: 4, equipo_id: 1, cantidad: 2, motivo: 'Clase de redes', estado: 'aprobado', fecha_solicitud: fecha(1), fecha_devolucion_prevista: '2026-10-30', fecha_entrega: null, fecha_devolucion: null },
            { id: 2, usuario_id: 3, equipo_id: 2, cantidad: 1, motivo: 'Prueba de monitor', estado: 'solicitado', fecha_solicitud: fecha(4), fecha_devolucion_prevista: null, fecha_entrega: null, fecha_devolucion: null },
            { id: 3, usuario_id: 7, equipo_id: 1, cantidad: 1, motivo: 'Taller de programación', estado: 'devuelto', fecha_solicitud: fecha(9), fecha_devolucion_prevista: '2026-10-15', fecha_entrega: fecha(8), fecha_devolucion: fecha(2) },
        ],
    };
}

/** Usuarios de prueba para el panel de desarrollo (nunca incluye datos que no sean de mentira). */
export function usuariosDePrueba() {
    return datosIniciales().usuarios.map(({ nombre, correo, clave, rol, activo }) => ({ nombre, correo, clave, rol, activo }));
}

class RespuestaError extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

const exito = (message, data = null, estado = 200) => ({ estado, cuerpo: { status: 'exito', message, data } });
const falla = (estado, message) => { throw new RespuestaError(estado, message); };
const texto = valor => String(valor ?? '').trim();
const entero = valor => Number.parseInt(valor, 10) || 0;

export function crearMockApi() {
    const db = datosIniciales();
    const usuarioPorId = id => db.usuarios.find(u => u.id === id);
    const nombreDe = id => usuarioPorId(id)?.nombre ?? null;

    function requerirSesion() {
        if (!db.sesion) falla(401, 'No autenticado');
        return db.sesion;
    }
    function requerirRol(roles) {
        const usuario = requerirSesion();
        if (!roles.includes(usuario.rol)) falla(403, 'No tiene permisos para realizar esta acción');
        return usuario;
    }
    const porFecha = lista => [...lista].sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion) || b.id - a.id);
    const esTecnicoActivo = id => db.usuarios.some(u => u.id === id && u.rol === 'tecnico' && u.activo === 1);
    const tecnicoOpcional = valor => (valor === undefined || valor === '' ? null : entero(valor));
    const verificarTecnico = id => {
        if (id !== null && !esTecnicoActivo(id)) falla(400, 'El usuario seleccionado no es un técnico activo.');
    };

    function ubicacionNombre(id) {
        const u = db.ubicaciones.find(x => x.id === id);
        return u ? [u.edificio, u.tipo, u.nombre, u.piso, u.referencia].filter(Boolean).join(' · ') : null;
    }

    // ---------- auth ----------
    function auth(accion, f) {
        switch (accion) {
            case 'login': {
                const correo = texto(f.correo);
                const clave = String(f.clave ?? '');
                if (!correo || !clave) falla(400, 'Correo y contraseña son obligatorios');
                const u = db.usuarios.find(x => x.correo === correo && x.clave === clave && x.activo === 1);
                if (!u) falla(401, 'Credenciales inválidas o usuario inactivo');
                db.sesion = { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol };
                return exito('Sesión iniciada', db.sesion);
            }
            case 'registro': {
                const nombre = texto(f.nombre);
                const correo = texto(f.correo);
                const clave = String(f.clave ?? '');
                if (!nombre || !correo || !clave) falla(400, 'Todos los campos son obligatorios');
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) falla(400, 'Correo inválido');
                if (clave.length < 8) falla(400, 'La contraseña debe tener al menos 8 caracteres');
                if (db.usuarios.some(u => u.correo === correo)) falla(409, 'Ya existe una cuenta con ese correo');
                db.usuarios.push({ id: db.sig.usuarios++, nombre, correo, clave, rol: 'usuario', activo: 1, fecha_creacion: fecha() });
                return exito('Cuenta creada correctamente', null, 201);
            }
            case 'logout':
                db.sesion = null;
                return exito('Sesión cerrada');
            case 'sesion':
                if (!db.sesion) falla(401, 'No hay sesión activa');
                return exito('Sesión activa', db.sesion);
            default:
                return falla(400, 'Acción no reconocida');
        }
    }

    // ---------- incidencias ----------
    function incidencias(accion, f) {
        const usuario = requerirSesion();
        const buscar = id => db.incidencias.find(i => i.id === id);
        switch (accion) {
            case 'listar': {
                const vistas = ['admin', 'tecnico'].includes(usuario.rol)
                    ? db.incidencias
                    : db.incidencias.filter(i => i.reportado_por === usuario.id);
                return exito('Incidencias obtenidas', porFecha(vistas).map(i => ({
                    ...i, nombre_reportador: nombreDe(i.reportado_por), nombre_tecnico: nombreDe(i.asignado_a),
                })));
            }
            case 'crear': {
                const titulo = texto(f.titulo);
                const descripcion = texto(f.descripcion);
                const area = texto(f.area);
                if (!titulo || !descripcion || !area) falla(400, 'Debe completar todos los campos');
                if (titulo.length < 5) falla(400, 'El título debe tener al menos 5 caracteres');
                if (descripcion.length < 10) falla(400, 'La descripción debe ser más detallada');
                const incidencia = {
                    id: db.sig.incidencias++, titulo, descripcion, area, equipo_id: f.equipo_id ? entero(f.equipo_id) : null,
                    prioridad: PRIORIDADES.includes(f.prioridad) ? f.prioridad : 'media', estado: 'abierta',
                    reportado_por: usuario.id, asignado_a: null, fecha_creacion: fecha(),
                };
                db.incidencias.push(incidencia);
                return exito('Incidencia guardada correctamente', { id: incidencia.id }, 201);
            }
            case 'actualizar': {
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const asignado = usuario.rol === 'tecnico' ? usuario.id : tecnicoOpcional(f.tecnico_id);
                if (usuario.rol === 'admin') verificarTecnico(asignado);
                if (!['abierta', 'en_proceso', 'resuelta', 'cerrada'].includes(f.estado)) falla(400, 'Estado inválido');
                const incidencia = buscar(id);
                if (incidencia) {
                    incidencia.estado = f.estado;
                    if (asignado !== null) incidencia.asignado_a = asignado;
                }
                return exito('Incidencia actualizada correctamente');
            }
            case 'asignar': {
                requerirRol(['admin']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const tecnico = tecnicoOpcional(f.tecnico_id);
                verificarTecnico(tecnico);
                const incidencia = buscar(id);
                if (incidencia) incidencia.asignado_a = tecnico;
                return exito('Asignación actualizada.');
            }
            case 'cambiar_prioridad': {
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido.');
                if (!PRIORIDADES.includes(f.prioridad)) falla(400, 'La prioridad seleccionada no es válida.');
                const incidencia = buscar(id);
                if (!incidencia) falla(404, 'La incidencia no existe o ya no está disponible.');
                incidencia.prioridad = f.prioridad;
                return exito('Prioridad actualizada correctamente.');
            }
            case 'eliminar': {
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido.');
                const indice = db.incidencias.findIndex(i => i.id === id);
                if (indice < 0) falla(404, 'La incidencia no existe o ya fue eliminada.');
                db.incidencias.splice(indice, 1);
                return exito('Incidencia eliminada correctamente.');
            }
            default:
                return falla(400, 'Acción no reconocida');
        }
    }

    // ---------- solicitudes ----------
    function solicitudes(accion, f) {
        const usuario = requerirSesion();
        const buscar = id => db.solicitudes.find(s => s.id === id);
        switch (accion) {
            case 'listar': {
                const filtros = {
                    admin: () => true,
                    tecnico: s => s.tecnico_id === usuario.id,
                    solicitante: s => s.solicitante_id === usuario.id,
                };
                const filtro = filtros[usuario.rol];
                const vistas = filtro ? db.solicitudes.filter(filtro) : [];
                return exito('Solicitudes obtenidas', porFecha(vistas).map(s => ({
                    ...s, nombre_solicitante: nombreDe(s.solicitante_id), nombre_tecnico: nombreDe(s.tecnico_id),
                })));
            }
            case 'crear': {
                requerirRol(['admin', 'solicitante']);
                const tipo = texto(f.tipo_servicio);
                const descripcion = texto(f.descripcion);
                if (!tipo || !descripcion || !f.prioridad) falla(400, 'Debe completar todos los campos');
                if (tipo.length < 3) falla(400, 'El tipo de servicio debe tener al menos 3 caracteres');
                if (descripcion.length < 10) falla(400, 'La descripción debe ser más detallada');
                const solicitud = {
                    id: db.sig.solicitudes++, tipo_servicio: tipo, descripcion,
                    prioridad: PRIORIDADES.includes(f.prioridad) ? f.prioridad : 'media', estado: 'pendiente',
                    solicitante_id: usuario.id, tecnico_id: null, fecha_creacion: fecha(),
                };
                db.solicitudes.push(solicitud);
                return exito('Solicitud enviada correctamente', { id: solicitud.id }, 201);
            }
            case 'actualizar': {
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const tecnico = usuario.rol === 'tecnico' ? usuario.id : tecnicoOpcional(f.tecnico_id);
                if (usuario.rol === 'admin') verificarTecnico(tecnico);
                if (!['pendiente', 'en_proceso', 'completada', 'rechazada'].includes(f.estado)) falla(400, 'Estado inválido');
                const solicitud = buscar(id);
                if (solicitud) {
                    solicitud.estado = f.estado;
                    if (tecnico !== null) solicitud.tecnico_id = tecnico;
                }
                return exito('Solicitud actualizada correctamente');
            }
            case 'asignar': {
                requerirRol(['admin']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const tecnico = tecnicoOpcional(f.tecnico_id);
                verificarTecnico(tecnico);
                const solicitud = buscar(id);
                if (solicitud) solicitud.tecnico_id = tecnico;
                return exito('Asignación actualizada.');
            }
            case 'cambiar_prioridad': {
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido.');
                if (!PRIORIDADES.includes(f.prioridad)) falla(400, 'La prioridad seleccionada no es válida.');
                const solicitud = buscar(id);
                if (!solicitud) falla(404, 'La solicitud no existe o ya no está disponible.');
                solicitud.prioridad = f.prioridad;
                return exito('Prioridad actualizada correctamente.');
            }
            case 'eliminar': {
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido.');
                const indice = db.solicitudes.findIndex(s => s.id === id);
                if (indice < 0) falla(404, 'La solicitud no existe o ya fue eliminada.');
                db.solicitudes.splice(indice, 1);
                return exito('Solicitud eliminada correctamente.');
            }
            default:
                return falla(400, 'Acción no reconocida');
        }
    }

    // ---------- inventario ----------
    function validarEquipo(f) {
        if (!texto(f.nombre)) falla(400, 'El nombre del equipo es obligatorio');
        const ubicacionId = entero(f.ubicacion_id);
        if (ubicacionId <= 0) falla(400, 'Seleccione una ubicación registrada.');
        if (!db.ubicaciones.some(u => u.id === ubicacionId && u.activa === 1)) falla(400, 'La ubicación seleccionada no está disponible.');
        return {
            nombre: texto(f.nombre), tipo: texto(f.tipo), marca: texto(f.marca), modelo: texto(f.modelo),
            numero_serie: texto(f.numero_serie), estado: ['activo', 'en_reparacion', 'de_baja'].includes(f.estado) ? f.estado : 'activo',
            ubicacion_id: ubicacionId, descripcion: texto(f.descripcion), cantidad: Math.max(1, entero(f.cantidad) || 1),
        };
    }

    function inventario(accion, f) {
        requerirSesion();
        switch (accion) {
            case 'ubicaciones':
                return exito('Ubicaciones obtenidas', db.ubicaciones.filter(u => u.activa === 1)
                    .map(({ activa, ...u }) => u));
            case 'crear_ubicacion': {
                requerirRol(['admin']);
                const nombre = texto(f.nombre);
                if (!nombre || !TIPOS_UBICACION.includes(f.tipo)) falla(400, 'Nombre y tipo de ubicación son obligatorios.');
                const ubicacion = {
                    id: db.sig.ubicaciones++, nombre, tipo: f.tipo, edificio: texto(f.edificio) || 'ITI',
                    piso: texto(f.piso) || null, referencia: texto(f.referencia) || null, activa: 1,
                };
                db.ubicaciones.push(ubicacion);
                return exito('Ubicación guardada.', { id: ubicacion.id }, 201);
            }
            case 'eliminar_ubicacion': {
                requerirRol(['admin']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido.');
                if (db.inventario.some(e => e.ubicacion_id === id)) falla(409, 'No se puede borrar: hay equipos asignados a esta ubicación.');
                const ubicacion = db.ubicaciones.find(u => u.id === id && u.activa === 1);
                if (!ubicacion) falla(404, 'La ubicación no existe o ya fue eliminada.');
                ubicacion.activa = 0;
                return exito('Ubicación eliminada correctamente.');
            }
            case 'listar':
                return exito('Inventario obtenido', [...db.inventario].sort((a, b) => b.id - a.id)
                    .map(e => ({ ...e, ubicacion_nombre: ubicacionNombre(e.ubicacion_id) })));
            case 'agregar': {
                requerirRol(['admin']);
                const equipo = { id: db.sig.inventario++, ...validarEquipo(f) };
                db.inventario.push(equipo);
                return exito('Equipo agregado correctamente', { id: equipo.id }, 201);
            }
            case 'editar': {
                requerirRol(['admin']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const datos = validarEquipo(f);
                const equipo = db.inventario.find(e => e.id === id);
                if (equipo) Object.assign(equipo, datos);
                return exito('Equipo actualizado correctamente');
            }
            case 'eliminar': {
                requerirRol(['admin']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const referenciado = db.prestamos.some(p => p.equipo_id === id) || db.incidencias.some(i => i.equipo_id === id);
                if (referenciado) falla(409, 'No se puede borrar: este equipo tiene préstamos o incidencias asociadas.');
                db.inventario = db.inventario.filter(e => e.id !== id);
                return exito('Equipo eliminado correctamente');
            }
            default:
                return falla(400, 'Acción no reconocida');
        }
    }

    // ---------- préstamos ----------
    const ACTIVOS = ['solicitado', 'aprobado', 'entregado'];
    const prestadas = equipoId => db.prestamos
        .filter(p => p.equipo_id === equipoId && ACTIVOS.includes(p.estado))
        .reduce((total, p) => total + p.cantidad, 0);

    function prestamos(accion, f, metodo) {
        const usuario = requerirSesion();
        const permitido = esperado => { if (metodo !== esperado) falla(405, 'Acción o método no permitido.'); };
        switch (accion) {
            case 'listar': {
                permitido('GET');
                const vistos = ['admin', 'tecnico'].includes(usuario.rol)
                    ? db.prestamos
                    : db.prestamos.filter(p => p.usuario_id === usuario.id);
                return exito('Préstamos obtenidos', [...vistos].sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud)).map(p => {
                    const equipo = db.inventario.find(e => e.id === p.equipo_id);
                    return { ...p, nombre_usuario: nombreDe(p.usuario_id), nombre_equipo: equipo?.nombre, numero_serie: equipo?.numero_serie };
                }));
            }
            case 'equipos': {
                permitido('GET');
                return exito('Equipos disponibles', db.inventario.filter(e => e.estado === 'activo')
                    .map(e => ({ id: e.id, nombre: e.nombre, numero_serie: e.numero_serie, disponible: e.cantidad - prestadas(e.id) }))
                    .filter(e => e.disponible > 0).sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }
            case 'crear': {
                permitido('POST');
                const equipoId = entero(f.equipo_id);
                const motivo = texto(f.motivo);
                const cantidad = Math.max(1, entero(f.cantidad) || 1);
                if (equipoId <= 0 || motivo.length < 5) falla(400, 'Seleccione un equipo y explique el motivo (mínimo 5 caracteres).');
                const equipo = db.inventario.find(e => e.id === equipoId && e.estado === 'activo');
                if (!equipo) falla(409, 'El equipo no está disponible para préstamo.');
                if (prestadas(equipoId) + cantidad > equipo.cantidad) falla(409, 'No hay suficientes unidades disponibles para ese préstamo.');
                const prestamo = {
                    id: db.sig.prestamos++, usuario_id: usuario.id, equipo_id: equipoId, cantidad, motivo, estado: 'solicitado',
                    fecha_solicitud: fecha(), fecha_devolucion_prevista: texto(f.fecha_devolucion_prevista) || null,
                    fecha_entrega: null, fecha_devolucion: null,
                };
                db.prestamos.push(prestamo);
                return exito('Solicitud de préstamo registrada.', { id: prestamo.id }, 201);
            }
            case 'eliminar': {
                permitido('POST');
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido.');
                const indice = db.prestamos.findIndex(p => p.id === id);
                if (indice < 0) falla(404, 'El préstamo no existe o ya fue eliminado.');
                db.prestamos.splice(indice, 1);
                return exito('Préstamo eliminado correctamente.');
            }
            case 'actualizar': {
                permitido('POST');
                requerirRol(['admin', 'tecnico']);
                const id = entero(f.id);
                if (id <= 0 || !['aprobado', 'entregado', 'devuelto', 'rechazado'].includes(f.estado)) falla(400, 'Datos de actualización inválidos.');
                if (usuario.rol === 'tecnico' && ['aprobado', 'rechazado'].includes(f.estado)) requerirRol(['admin']);
                const prestamo = db.prestamos.find(p => p.id === id && ACTIVOS.includes(p.estado));
                if (!prestamo) falla(409, 'El préstamo no existe o ya fue finalizado.');
                prestamo.estado = f.estado;
                if (f.estado === 'entregado') prestamo.fecha_entrega = fecha();
                if (f.estado === 'devuelto') prestamo.fecha_devolucion = fecha();
                return exito('Préstamo actualizado.');
            }
            default:
                return falla(405, 'Acción o método no permitido.');
        }
    }

    // ---------- usuarios (solo admin) ----------
    function usuarios(accion, f) {
        requerirRol(['admin']);
        switch (accion) {
            case 'tecnicos':
                return exito('Técnicos obtenidos', db.usuarios.filter(u => u.rol === 'tecnico' && u.activo === 1)
                    .map(({ id, nombre }) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre)));
            case 'listar':
                return exito('Usuarios obtenidos', [...db.usuarios].sort((a, b) => b.id - a.id)
                    .map(({ id, nombre, correo, rol, activo, fecha_creacion }) => ({ id, nombre, correo, rol, activo, fecha_creacion })));
            case 'cambiar_rol': {
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                if (!ROLES.includes(f.nuevo_rol)) falla(400, 'Rol inválido');
                const u = usuarioPorId(id);
                if (u) u.rol = f.nuevo_rol;
                return exito('Rol actualizado correctamente');
            }
            case 'activar_desactivar': {
                const id = entero(f.id);
                if (id <= 0) falla(400, 'ID inválido');
                const u = usuarioPorId(id);
                // PHP: (bool) "0" es false, cualquier otro texto no vacío es true
                if (u) u.activo = f.activo && f.activo !== '0' ? 1 : 0;
                return exito('Estado actualizado correctamente');
            }
            default:
                return falla(400, 'Acción no reconocida');
        }
    }

    const endpoints = { 'auth.php': auth, 'incidencias.php': incidencias, 'solicitudes.php': solicitudes, 'inventario.php': inventario, 'prestamos.php': prestamos, 'usuarios.php': usuarios };

    /**
     * @param {{ metodo: string, endpoint: string, accion: string | null, campos: Record<string, string> }} peticion
     * @returns {{ estado: number, cuerpo: { status: string, message: string, data: unknown } }}
     */
    function manejar({ metodo, endpoint, accion, campos }) {
        const controlador = endpoints[endpoint];
        if (!controlador) return { estado: 404, cuerpo: { status: 'error', message: `Endpoint no simulado: ${endpoint}`, data: null } };
        try {
            const porDefecto = endpoint === 'prestamos.php' ? 'listar' : '';
            return controlador(accion ?? porDefecto, campos, metodo);
        } catch (error) {
            if (error instanceof RespuestaError) return { estado: error.estado, cuerpo: { status: 'error', message: error.message, data: null } };
            return { estado: 500, cuerpo: { status: 'error', message: `Error del mock: ${error.message}`, data: null } };
        }
    }

    return { manejar };
}
