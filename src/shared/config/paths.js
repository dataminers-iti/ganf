// Rutas de la aplicación y base de la API.
//
// Se calculan desde la ubicación de este módulo, así funcionan tanto si la
// app se sirve en la raíz del dominio como en un subdirectorio (XAMPP).

export const RAIZ_APP = new URL('../../../', import.meta.url);

export function rutaApp(ruta) {
    return new URL(ruta, RAIZ_APP).href;
}

export function rutaApi(ruta) {
    return new URL(`api/${ruta}`, RAIZ_APP);
}

export const RUTAS = Object.freeze({
    login: rutaApp('index.html'),
    registro: rutaApp('sites/registro.html'),
    panel: rutaApp('sites/principal.html'),
    incidencias: rutaApp('sites/incidencias.html'),
    servicio: rutaApp('sites/servicio.html'),
    inventario: rutaApp('sites/inventario.html'),
    prestamos: rutaApp('sites/prestamos.html'),
    adminUsuarios: rutaApp('sites/admin_usuarios.html'),
    sistema: rutaApp('sites/sistema.html'),
});
