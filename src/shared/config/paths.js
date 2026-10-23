// Rutas de la aplicación y base de la API.
//
// La raíz se deduce del documento actual: todas las páginas viven en la raíz
// (index.html) o en sites/ (el resto). Así funciona igual servida en la raíz
// del dominio, en un subdirectorio (XAMPP) o empaquetada con Vite, donde este
// módulo termina dentro de /assets/ y ya no sirve contar niveles de carpeta.
//
// En Node (tests) no hay `document`, así que se usa la ubicación del módulo.

function calcularRaiz() {
    if (typeof document !== 'undefined' && document.baseURI) {
        const carpetaPagina = new URL('.', document.baseURI);
        return carpetaPagina.pathname.endsWith('/sites/')
            ? new URL('../', carpetaPagina)
            : carpetaPagina;
    }
    const rutaModulo = import.meta.url;
    return new URL('../../../', rutaModulo);
}

export const RAIZ_APP = calcularRaiz();

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
