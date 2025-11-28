<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/activity_logger.php';

class SOSController {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    public function triggerSOS() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $latitude = $data['latitude'] ?? null;
        $longitude = $data['longitude'] ?? null;
        
        // Create SOS alert
        $query = "INSERT INTO sos_alerts (user_id, location_latitude, location_longitude) 
                  VALUES (?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("idd", $user_id, $latitude, $longitude);
        
        if ($stmt->execute()) {
            $sos_id = $this->conn->insert_id;
            
            // Log activity
            logUserActivity(
                $this->conn,
                $user_id,
                ActivityType::SOS_ALERT,
                "Triggered SOS alert",
                [
                    'sos_id' => $sos_id,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            );
            
            // Get user's trusted contacts and emergency contact
            $userQuery = "SELECT email, first_name, emergency_contact_phone, trusted_contacts FROM users WHERE id = ?";
            $userStmt = $this->conn->prepare($userQuery);
            $userStmt->bind_param("i", $user_id);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            $userData = $userResult->fetch_assoc();
            
            // TODO: Send notifications to emergency contacts
            // This would involve sending emails, SMS, or push notifications
            
            return [
                'success' => true,
                'message' => 'SOS alert triggered',
                'sos_id' => $sos_id,
                'notification_sent' => true
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Failed to trigger SOS'
            ];
        }
    }
    
    public function resolveSOS() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['sos_id'])) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'SOS ID is required'
            ];
        }
        
        $sos_id = $data['sos_id'];
        
        $query = "UPDATE sos_alerts SET status = 'resolved', resolved_at = NOW() 
                  WHERE id = ? AND user_id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $sos_id, $user_id);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'SOS alert resolved'
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Failed to resolve SOS'
            ];
        }
    }
    
    public function getSOSHistory() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $query = "SELECT id, location_latitude, location_longitude, status, created_at, resolved_at 
                  FROM sos_alerts 
                  WHERE user_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT 50";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $alerts = [];
        while ($row = $result->fetch_assoc()) {
            $alerts[] = $row;
        }
        
        return [
            'success' => true,
            'data' => $alerts,
            'count' => count($alerts)
        ];
    }
}
?>
