<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AdminController.php';

// Simple admin authentication (you can replace with better auth)
function isAdminAuthenticated()
{
    // Get token from header
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';

    if (strpos($token, 'Bearer ') !== 0) {
        return false;
    }

    $token = substr($token, 7);

    // Simple hardcoded admin token (replace with database check)
    $adminToken = 'admin_secret_token_12345';
    
    return $token === $adminToken;
}

// Check admin authentication
if (!isAdminAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin token required.']);
    exit;
}

$action = $_GET['action'] ?? '';
$adminController = new AdminController($conn);

try {
    switch ($action) {
        case 'all-users':
            echo json_encode($adminController->getAllUsers());
            break;

        case 'user-details':
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                throw new Exception('User ID is required');
            }
            echo json_encode($adminController->getUserDetails($userId));
            break;

        case 'user-activity':
            $userId = $_GET['user_id'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            if (!$userId) {
                throw new Exception('User ID is required');
            }
            echo json_encode($adminController->getUserActivityTimeline($userId, $limit));
            break;

        case 'mood-analytics':
            echo json_encode($adminController->getMoodAnalytics());
            break;

        case 'sos-analytics':
            echo json_encode($adminController->getSOSAnalytics());
            break;

        case 'dashboard-summary':
            echo json_encode($adminController->getDashboardSummary());
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action',
                'available_actions' => [
                    'all-users',
                    'user-details?user_id=ID',
                    'user-activity?user_id=ID',
                    'mood-analytics',
                    'sos-analytics',
                    'dashboard-summary'
                ]
            ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

?>
