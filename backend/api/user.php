<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/UserController.php';

$method = $_SERVER['REQUEST_METHOD'];
$controller = new UserController($conn);

$action = $_GET['action'] ?? 'profile';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'profile':
                $response = $controller->getProfile();
                break;
            case 'trusted-contacts':
                $response = $controller->getTrustedContacts();
                break;
            default:
                http_response_code(400);
                $response = [
                    'success' => false,
                    'message' => 'Invalid action'
                ];
        }
        break;
    
    case 'POST':
        switch ($action) {
            case 'update':
                $response = $controller->updateProfile();
                break;
            case 'add-contact':
                $response = $controller->addTrustedContact();
                break;
            case 'delete-contact':
                $response = $controller->deleteTrustedContact();
                break;
            case 'heartbeat':
                $response = $controller->updateLastActive();
                break;
            default:
                http_response_code(400);
                $response = [
                    'success' => false,
                    'message' => 'Invalid action'
                ];
        }
        break;
    
    default:
        http_response_code(405);
        $response = [
            'success' => false,
            'message' => 'Method not allowed'
        ];
}

echo json_encode($response);
?>
