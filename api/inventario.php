<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/models/Inventario.php';

$db = Database::obtenerConexion();
$modelo = new InventarioModel($db);
$accion = $_GET['accion'] ?? '';

requerirSesion(); // cualquier rol autenticado puede consultar el inventario

if (in_array($accion, ['listar', 'ubicaciones', 'crear_ubicacion'], true)) {
    $tablas = $db->query("SHOW TABLES LIKE 'ubicaciones'")->fetchColumn();
    if (!$tablas) responder('error', 'Falta actualizar la base para usar ubicaciones. Importá upgrade_sgrsi.sql en sgrsi_db (o setup.sql si es una instalación nueva).', null, 503);
}

switch ($accion) {
    case 'ubicaciones':
        $stmt = $db->query('SELECT id, nombre, tipo, edificio, piso, referencia FROM ubicaciones WHERE activa = 1 ORDER BY edificio, tipo, nombre');
        responder('exito', 'Ubicaciones obtenidas', $stmt->fetchAll());
        break;

    case 'eliminar_ubicacion':
        requerirRol(['admin']);
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) responder('error', 'ID inválido.', null, 400);
        $uso = $db->prepare('SELECT COUNT(*) FROM inventario WHERE ubicacion_id = :id');
        $uso->execute(['id' => $id]);
        if ((int)$uso->fetchColumn() > 0) responder('error', 'No se puede borrar: hay equipos asignados a esta ubicación.', null, 409);
        $stmt = $db->prepare('UPDATE ubicaciones SET activa = 0 WHERE id = :id AND activa = 1');
        $stmt->execute(['id' => $id]);
        if (!$stmt->rowCount()) responder('error', 'La ubicación no existe o ya fue eliminada.', null, 404);
        responder('exito', 'Ubicación eliminada correctamente.');
        break;

    case 'crear_ubicacion':
        requerirRol(['admin']);
        $nombre = trim((string) ($_POST['nombre'] ?? ''));
        $tipo = (string) ($_POST['tipo'] ?? '');
        $edificio = trim((string) ($_POST['edificio'] ?? 'ITI'));
        $piso = trim((string) ($_POST['piso'] ?? ''));
        $referencia = trim((string) ($_POST['referencia'] ?? ''));
        if ($nombre === '' || !in_array($tipo, ['laboratorio','salon','administracion','otro'], true)) responder('error', 'Nombre y tipo de ubicación son obligatorios.', null, 400);
        $stmt = $db->prepare('INSERT INTO ubicaciones (nombre, tipo, edificio, piso, referencia) VALUES (:nombre,:tipo,:edificio,:piso,:referencia)');
        $stmt->execute(['nombre'=>$nombre,'tipo'=>$tipo,'edificio'=>$edificio ?: 'ITI','piso'=>$piso ?: null,'referencia'=>$referencia ?: null]);
        responder('exito', 'Ubicación guardada.', ['id'=>(int)$db->lastInsertId()], 201);
        break;
    case 'listar':
        responder('exito', 'Inventario obtenido', $modelo->listar());
        break;

    case 'agregar':
        requerirRol(['admin']);
        $nombre = trim((string) ($_POST['nombre'] ?? ''));
        if ($nombre === '') {
            responder('error', 'El nombre del equipo es obligatorio', null, 400);
        }
        $ubicacionId = (int) ($_POST['ubicacion_id'] ?? 0);
        if ($ubicacionId <= 0) responder('error', 'Seleccione una ubicación registrada.', null, 400);
        $ubicacionValida = $db->prepare('SELECT id FROM ubicaciones WHERE id = :id AND activa = 1');
        $ubicacionValida->execute(['id' => $ubicacionId]);
        if (!$ubicacionValida->fetch()) responder('error', 'La ubicación seleccionada no está disponible.', null, 400);
        $id = $modelo->agregar($_POST);
        responder('exito', 'Equipo agregado correctamente', ['id' => $id], 201);
        break;

    case 'editar':
        requerirRol(['admin']);
        $id = (int) ($_POST['id'] ?? 0);
        $nombre = trim((string) ($_POST['nombre'] ?? ''));
        if ($id <= 0) responder('error', 'ID inválido', null, 400);
        if ($nombre === '') responder('error', 'El nombre del equipo es obligatorio', null, 400);
        $ubicacionId = (int) ($_POST['ubicacion_id'] ?? 0);
        if ($ubicacionId <= 0) responder('error', 'Seleccione una ubicación registrada.', null, 400);
        $ubicacionValida = $db->prepare('SELECT id FROM ubicaciones WHERE id = :id AND activa = 1');
        $ubicacionValida->execute(['id' => $ubicacionId]);
        if (!$ubicacionValida->fetch()) responder('error', 'La ubicación seleccionada no está disponible.', null, 400);
        $modelo->editar($id, $_POST);
        responder('exito', 'Equipo actualizado correctamente', null);
        break;

    case 'eliminar':
        requerirRol(['admin']);
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) responder('error', 'ID inválido', null, 400);
        $referencias = $db->prepare('SELECT (SELECT COUNT(*) FROM prestamos WHERE equipo_id = :prestamo) + (SELECT COUNT(*) FROM incidencias WHERE equipo_id = :incidencia)');
        $referencias->execute(['prestamo' => $id, 'incidencia' => $id]);
        if ((int)$referencias->fetchColumn() > 0) responder('error', 'No se puede borrar: este equipo tiene préstamos o incidencias asociadas.', null, 409);
        $modelo->eliminar($id);
        responder('exito', 'Equipo eliminado correctamente', null);
        break;

    default:
        responder('error', 'Acción no reconocida', null, 400);
}
