<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/models/Solicitud.php';

$db = Database::obtenerConexion();
$modelo = new SolicitudModel($db);
$accion = $_GET['accion'] ?? '';
$usuario = requerirSesion();

switch ($accion) {
    case 'listar':
        // El modelo ya filtra según el rol (ver SolicitudModel::listar)
        responder('exito', 'Solicitudes obtenidas', $modelo->listar($usuario));
        break;

    case 'crear':
        requerirRol(['admin', 'solicitante']);
        $tipo = trim((string) ($_POST['tipo_servicio'] ?? ''));
        $descripcion = trim((string) ($_POST['descripcion'] ?? ''));
        $prioridad = (string) ($_POST['prioridad'] ?? '');

        if ($tipo === '' || $descripcion === '' || $prioridad === '') {
            responder('error', 'Debe completar todos los campos', null, 400);
        }
        if (strlen($tipo) < 3) {
            responder('error', 'El tipo de servicio debe tener al menos 3 caracteres', null, 400);
        }
        if (strlen($descripcion) < 10) {
            responder('error', 'La descripción debe ser más detallada', null, 400);
        }

        $id = $modelo->crear($_POST, (int) $usuario['id']);
        responder('exito', 'Solicitud enviada correctamente', ['id' => $id], 201);
        break;

    case 'actualizar':
        requerirRol(['admin', 'tecnico']);
        $id = (int) ($_POST['id'] ?? 0);
        $estado = (string) ($_POST['estado'] ?? '');
        if ($id <= 0) responder('error', 'ID inválido', null, 400);

        $tecnicoId = $usuario['rol'] === 'tecnico' ? (int) $usuario['id'] : (isset($_POST['tecnico_id']) && $_POST['tecnico_id'] !== '' ? (int) $_POST['tecnico_id'] : null);
        if ($usuario['rol'] === 'admin' && $tecnicoId !== null) {
            $check = $db->prepare("SELECT id FROM usuarios WHERE id = :id AND rol = 'tecnico' AND activo = 1");
            $check->execute(['id' => $tecnicoId]);
            if (!$check->fetch()) responder('error', 'El usuario seleccionado no es un técnico activo.', null, 400);
        }

        if (!$modelo->actualizar($id, $estado, $tecnicoId)) {
            responder('error', 'Estado inválido', null, 400);
        }
        responder('exito', 'Solicitud actualizada correctamente', null);
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
        $stmt = $db->prepare('UPDATE solicitudes SET tecnico_id = :tecnico WHERE id = :id');
        $stmt->execute(['tecnico' => $tecnicoId, 'id' => $id]);
        responder('exito', 'Asignación actualizada.');
        break;

    case 'cambiar_prioridad':
        requerirRol(['admin', 'tecnico']);
        $id = (int) ($_POST['id'] ?? 0);
        $prioridad = (string) ($_POST['prioridad'] ?? '');
        if ($id <= 0 || !in_array($prioridad, ['alta', 'media', 'baja'], true)) responder('error', 'Datos de prioridad inválidos.', null, 400);
        if (!$modelo->cambiarPrioridad($id, $prioridad)) responder('error', 'La solicitud no existe o la prioridad no cambió.', null, 404);
        responder('exito', 'Prioridad actualizada correctamente.');
        break;

    case 'eliminar':
        requerirRol(['admin', 'tecnico']);
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) responder('error', 'ID inválido.', null, 400);
        if (!$modelo->eliminar($id)) responder('error', 'La solicitud no existe o ya fue eliminada.', null, 404);
        responder('exito', 'Solicitud eliminada correctamente.');
        break;

    default:
        responder('error', 'Acción no reconocida', null, 400);
}
