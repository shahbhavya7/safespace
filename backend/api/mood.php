<?php
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/MoodController.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$controller = new MoodController($conn);
$action = $_GET['action'] ?? 'logs';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'logs':
                $response = $controller->getMoodLogs();
                break;
            case 'stats':
                $response = $controller->getMoodStats();
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
            case 'save':
                $response = $controller->saveMoodLog();
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
