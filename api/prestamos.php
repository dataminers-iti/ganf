<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

$db = Database::obtenerConexion();
$usuario = requerirSesion();
$accion = $_GET['accion'] ?? 'listar';

$tablaPrestamos = $db->query("SHOW TABLES LIKE 'prestamos'")->fetchColumn();
if (!$tablaPrestamos) responder('error', 'Falta crear la tabla de préstamos. Importá upgrade_sgrsi.sql en sgrsi_db (o setup.sql si es una instalación nueva).', null, 503);
$columnasPrestamos = $db->query('SHOW COLUMNS FROM prestamos')->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('cantidad', $columnasPrestamos, true)) responder('error', 'La tabla de préstamos está desactualizada. Volvé a aplicar la actualización de base de datos.', null, 503);

if ($accion === 'listar' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = 'SELECT p.*, u.nombre AS nombre_usuario, i.nombre AS nombre_equipo, i.numero_serie
            FROM prestamos p JOIN usuarios u ON u.id = p.usuario_id
            JOIN inventario i ON i.id = p.equipo_id';
    if (!in_array($usuario['rol'], ['admin', 'tecnico'], true)) {
        $sql .= ' WHERE p.usuario_id = :uid';
        $stmt = $db->prepare($sql . ' ORDER BY p.fecha_solicitud DESC');
        $stmt->execute(['uid' => $usuario['id']]);
    } else {
        $stmt = $db->query($sql . ' ORDER BY p.fecha_solicitud DESC');
    }
    responder('exito', 'Préstamos obtenidos', $stmt->fetchAll());
}

if ($accion === 'equipos' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("SELECT i.id, i.nombre, i.numero_serie, (i.cantidad - COALESCE(SUM(CASE WHEN p.estado IN ('solicitado','aprobado','entregado') THEN p.cantidad ELSE 0 END), 0)) AS disponible
        FROM inventario i LEFT JOIN prestamos p ON p.equipo_id = i.id
        WHERE i.estado = 'activo' GROUP BY i.id HAVING disponible > 0 ORDER BY i.nombre");
    responder('exito', 'Equipos disponibles', $stmt->fetchAll());
}

if ($accion === 'crear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $equipoId = (int) ($_POST['equipo_id'] ?? 0);
    $motivo = trim((string) ($_POST['motivo'] ?? ''));
    $cantidad = max(1, (int) ($_POST['cantidad'] ?? 1));
    $fechaPrevista = trim((string) ($_POST['fecha_devolucion_prevista'] ?? '')) ?: null;
    if ($equipoId <= 0 || strlen($motivo) < 5) responder('error', 'Seleccione un equipo y explique el motivo (mínimo 5 caracteres).', null, 400);
    $db->beginTransaction();
    try {
        $equipo = $db->prepare("SELECT id, cantidad FROM inventario WHERE id = :id AND estado = 'activo' FOR UPDATE");
        $equipo->execute(['id' => $equipoId]);
        $datosEquipo = $equipo->fetch();
        if (!$datosEquipo) {
            $db->rollBack();
            responder('error', 'El equipo no está disponible para préstamo.', null, 409);
        }
        $prestado = $db->prepare("SELECT COALESCE(SUM(cantidad),0) AS cantidad FROM prestamos WHERE equipo_id = :id AND estado IN ('solicitado','aprobado','entregado')");
        $prestado->execute(['id' => $equipoId]);
        if ((int)$prestado->fetch()['cantidad'] + $cantidad > (int)$datosEquipo['cantidad']) {
            $db->rollBack();
            responder('error', 'No hay suficientes unidades disponibles para ese préstamo.', null, 409);
        }
        $insert = $db->prepare("INSERT INTO prestamos (usuario_id, equipo_id, cantidad, motivo, fecha_devolucion_prevista) VALUES (:uid, :eid, :cantidad, :motivo, :fecha)");
        $insert->execute(['uid' => $usuario['id'], 'eid' => $equipoId, 'cantidad' => $cantidad, 'motivo' => $motivo, 'fecha' => $fechaPrevista]);
        $id = (int) $db->lastInsertId();
        $db->commit();
        responder('exito', 'Solicitud de préstamo registrada.', ['id' => $id], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        responder('error', 'No se pudo registrar el préstamo.', null, 500);
    }
}

if ($accion === 'actualizar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requerirRol(['admin', 'tecnico']);
    $id = (int) ($_POST['id'] ?? 0);
    $estado = (string) ($_POST['estado'] ?? '');
    $estados = ['aprobado', 'entregado', 'devuelto', 'rechazado'];
    if ($id <= 0 || !in_array($estado, $estados, true)) responder('error', 'Datos de actualización inválidos.', null, 400);
    if ($usuario['rol'] === 'tecnico' && in_array($estado, ['aprobado', 'rechazado'], true)) requerirRol(['admin']);
    $fecha = $estado === 'entregado' ? ', fecha_entrega = NOW()' : ($estado === 'devuelto' ? ', fecha_devolucion = NOW()' : '');
    $stmt = $db->prepare("UPDATE prestamos SET estado = :estado $fecha WHERE id = :id AND estado IN ('solicitado','aprobado','entregado')");
    $stmt->execute(['estado' => $estado, 'id' => $id]);
    if (!$stmt->rowCount()) responder('error', 'El préstamo no existe o ya fue finalizado.', null, 409);
    responder('exito', 'Préstamo actualizado.');
}

responder('error', 'Acción o método no permitido.', null, 405);
