<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

class MoodController {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    public function saveMoodLog() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['mood_level'])) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'Mood level is required'
            ];
        }
        
        $mood_level = $data['mood_level'];
        $mood_emoji = $data['mood_emoji'] ?? '';
        $mood_label = $data['mood_label'] ?? '';
        $notes = $data['notes'] ?? '';
        
        $query = "INSERT INTO mood_logs (user_id, mood_level, mood_emoji, mood_label, notes) 
                  VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("isss", $user_id, $mood_level, $mood_emoji, $mood_label, $notes);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Mood logged successfully',
                'mood_id' => $this->conn->insert_id
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Failed to save mood log'
            ];
        }
    }
    
    public function getMoodLogs() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $days = $_GET['days'] ?? 7;
        $days = intval($days);
        
        $query = "SELECT id, mood_level, mood_emoji, mood_label, notes, created_at 
                  FROM mood_logs 
                  WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $user_id, $days);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
        
        return [
            'success' => true,
            'data' => $logs,
            'count' => count($logs)
        ];
    }
    
    public function getMoodStats() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $query = "SELECT 
                    AVG(mood_level) as average_mood,
                    MAX(mood_level) as best_mood,
                    MIN(mood_level) as worst_mood,
                    COUNT(*) as total_logs
                  FROM mood_logs 
                  WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $stats = $result->fetch_assoc();
        
        return [
            'success' => true,
            'stats' => $stats
        ];
    }
}
?>
