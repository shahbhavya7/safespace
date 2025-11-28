<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$method = $_SERVER['REQUEST_METHOD'];
$controller = new AuthController($conn);

if ($method === 'POST') {
    $action = $_GET['action'] ?? 'login';
    
    switch ($action) {
        case 'register':
            $response = $controller->register();
            break;
        case 'login':
            $response = $controller->login();
            break;
        case 'logout':
            $response = $controller->logout();
            break;
        default:
            http_response_code(400);
            $response = [
                'success' => false,
                'message' => 'Invalid action'
            ];
    }
} else {
    http_response_code(405);
    $response = [
        'success' => false,
        'message' => 'Method not allowed'
    ];
}

echo json_encode($response);
?>
