<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/models/Incidencia.php';

$db = Database::obtenerConexion();
$modelo = new IncidenciaModel($db);
$accion = $_GET['accion'] ?? '';
$usuario = requerirSesion();

switch ($accion) {
    case 'listar':
        // El modelo ya filtra según el rol (ver IncidenciaModel::listar)
        responder('exito', 'Incidencias obtenidas', $modelo->listar($usuario));
        break;

    case 'crear':
        // Los 4 roles pueden registrar incidencias
        $titulo = trim((string) ($_POST['titulo'] ?? ''));
        $descripcion = trim((string) ($_POST['descripcion'] ?? ''));
        $area = trim((string) ($_POST['area'] ?? ''));

        if ($titulo === '' || $descripcion === '' || $area === '') {
            responder('error', 'Debe completar todos los campos', null, 400);
        }
        if (strlen($titulo) < 5) {
            responder('error', 'El título debe tener al menos 5 caracteres', null, 400);
        }
        if (strlen($descripcion) < 10) {
            responder('error', 'La descripción debe ser más detallada', null, 400);
        }

        $id = $modelo->crear($_POST, (int) $usuario['id']);
        responder('exito', 'Incidencia guardada correctamente', ['id' => $id], 201);
        break;

    case 'actualizar':
        requerirRol(['admin', 'tecnico']);
        $id = (int) ($_POST['id'] ?? 0);
        $estado = (string) ($_POST['estado'] ?? '');
        if ($id <= 0) responder('error', 'ID inválido', null, 400);

        $asignadoA = $usuario['rol'] === 'tecnico' ? (int) $usuario['id'] : (isset($_POST['tecnico_id']) && $_POST['tecnico_id'] !== '' ? (int) $_POST['tecnico_id'] : null);
        if ($usuario['rol'] === 'admin' && $asignadoA !== null) {
            $check = $db->prepare("SELECT id FROM usuarios WHERE id = :id AND rol = 'tecnico' AND activo = 1");
            $check->execute(['id' => $asignadoA]);
            if (!$check->fetch()) responder('error', 'El usuario seleccionado no es un técnico activo.', null, 400);
        }

        if (!$modelo->actualizar($id, $estado, $asignadoA)) {
            responder('error', 'Estado inválido', null, 400);
        }
        responder('exito', 'Incidencia actualizada correctamente', null);
        break;

    case 'asignar':
        requerirRol(['admin']);
        $id = (int) ($_POST['id'] ?? 0);
        $tecnicoId = ($_POST['tecnico_id'] ?? '') === '' ? null : (int) $_POST['tecnico_id'];
        if ($id <= 0) responder('error', 'ID inválido', null, 400);
        if ($tecnicoId !== null) {
            $check = $db->prepare("SELECT id FROM usuarios WHERE id = :id AND rol = 'tecnico' AND activo = 1");
            $check->execute(['id' => $tecnicoId]);
            if (!$check->fetch()) responder('error', 'El usuario seleccionado no es un técnico activo.', null, 400);
        }
        $stmt = $db->prepare('UPDATE incidencias SET asignado_a = :tecnico WHERE id = :id');
        $stmt->execute(['tecnico' => $tecnicoId, 'id' => $id]);
        responder('exito', 'Asignación actualizada.');
        break;

    case 'cambiar_prioridad':
        requerirRol(['admin', 'tecnico']);
        $id = (int) ($_POST['id'] ?? 0);
        $prioridad = (string) ($_POST['prioridad'] ?? '');
        if ($id <= 0) responder('error', 'ID inválido.', null, 400);
        if (!in_array($prioridad, ['alta', 'media', 'baja'], true)) {
            responder('error', 'La prioridad seleccionada no es válida.', null, 400);
        }
        if (!$modelo->cambiarPrioridad($id, $prioridad)) {
            responder('error', 'La incidencia no existe o ya no está disponible.', null, 404);
        }
        responder('exito', 'Prioridad actualizada correctamente.');
        break;

    case 'eliminar':
        requerirRol(['admin', 'tecnico']);
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) responder('error', 'ID inválido.', null, 400);
        if (!$modelo->eliminar($id)) {
            responder('error', 'La incidencia no existe o ya fue eliminada.', null, 404);
        }
        responder('exito', 'Incidencia eliminada correctamente.');
        break;

    default:
        responder('error', 'Acción no reconocida', null, 400);
}
