<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

class AdminController
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // Get all users with their basic info
    public function getAllUsers()
    {
        try {
            $query = "SELECT 
                        u.id,
                        u.email,
                        u.first_name,
                        u.last_name,
                        u.phone_number,
                        u.emergency_contact_name,
                        u.emergency_contact_phone,
                        u.created_at,
                        COUNT(DISTINCT m.id) as mood_logs_count,
                        COUNT(DISTINCT s.id) as sos_alerts_count,
                        MAX(m.created_at) as last_mood_log
                     FROM users u
                     LEFT JOIN mood_logs m ON u.id = m.user_id
                     LEFT JOIN sos_alerts s ON u.id = s.user_id
                     GROUP BY u.id
                     ORDER BY u.created_at DESC";

            $result = $this->conn->query($query);
            
            if (!$result) {
                throw new Exception("Query failed: " . $this->conn->error);
            }

            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }

            return [
                'success' => true,
                'data' => $users,
                'count' => count($users)
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get specific user with all interactions
    public function getUserDetails($userId)
    {
        try {
            // Get user basic info
            $query = "SELECT * FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $userResult = $stmt->get_result();
            
            if ($userResult->num_rows === 0) {
                throw new Exception("User not found");
            }

            $user = $userResult->fetch_assoc();

            // Get mood logs
            $moodQuery = "SELECT id, mood_level, mood_emoji, mood_label, notes, created_at 
                         FROM mood_logs 
                         WHERE user_id = ? 
                         ORDER BY created_at DESC 
                         LIMIT 100";
            $stmt = $this->conn->prepare($moodQuery);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $moodResult = $stmt->get_result();
            $moodLogs = [];
            while ($row = $moodResult->fetch_assoc()) {
                $moodLogs[] = $row;
            }

            // Get SOS alerts
            $sosQuery = "SELECT id, latitude, longitude, alert_status, created_at, resolved_at 
                        FROM sos_alerts 
                        WHERE user_id = ? 
                        ORDER BY created_at DESC 
                        LIMIT 50";
            $stmt = $this->conn->prepare($sosQuery);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $sosResult = $stmt->get_result();
            $sosAlerts = [];
            while ($row = $sosResult->fetch_assoc()) {
                $sosAlerts[] = $row;
            }

            // Get trusted contacts
            $contactsQuery = "SELECT trusted_contacts FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($contactsQuery);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $contactResult = $stmt->get_result();
            $contactRow = $contactResult->fetch_assoc();
            $trustedContacts = json_decode($contactRow['trusted_contacts'] ?? '[]', true);

            return [
                'success' => true,
                'user' => $user,
                'mood_logs' => $moodLogs,
                'mood_logs_count' => count($moodLogs),
                'sos_alerts' => $sosAlerts,
                'sos_alerts_count' => count($sosAlerts),
                'trusted_contacts' => $trustedContacts,
                'stats' => [
                    'total_moods' => count($moodLogs),
                    'total_sos' => count($sosAlerts),
                    'avg_mood' => $this->getAverageMood($moodLogs)
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get mood analytics for all users
    public function getMoodAnalytics()
    {
        try {
            $query = "SELECT 
                        DATE(m.created_at) as date,
                        AVG(m.mood_level) as avg_mood,
                        COUNT(*) as total_logs,
                        MIN(m.mood_level) as min_mood,
                        MAX(m.mood_level) as max_mood
                     FROM mood_logs m
                     WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                     GROUP BY DATE(m.created_at)
                     ORDER BY date DESC";

            $result = $this->conn->query($query);
            $analytics = [];
            while ($row = $result->fetch_assoc()) {
                $analytics[] = $row;
            }

            // Get overall stats
            $statsQuery = "SELECT 
                            COUNT(DISTINCT user_id) as total_users_with_logs,
                            AVG(mood_level) as overall_avg_mood,
                            COUNT(*) as total_mood_logs
                         FROM mood_logs
                         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            
            $statsResult = $this->conn->query($statsQuery);
            $stats = $statsResult->fetch_assoc();

            return [
                'success' => true,
                'analytics' => $analytics,
                'stats' => $stats
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get SOS alerts analytics
    public function getSOSAnalytics()
    {
        try {
            $query = "SELECT 
                        id,
                        user_id,
                        (SELECT email FROM users WHERE id = user_id) as user_email,
                        latitude,
                        longitude,
                        alert_status,
                        created_at,
                        resolved_at
                     FROM sos_alerts
                     ORDER BY created_at DESC
                     LIMIT 100";

            $result = $this->conn->query($query);
            $alerts = [];
            while ($row = $result->fetch_assoc()) {
                $alerts[] = $row;
            }

            // Get stats
            $statsQuery = "SELECT 
                            COUNT(*) as total_alerts,
                            COUNT(CASE WHEN alert_status = 'active' THEN 1 END) as active_alerts,
                            COUNT(CASE WHEN alert_status = 'resolved' THEN 1 END) as resolved_alerts,
                            COUNT(DISTINCT user_id) as users_triggered_sos
                         FROM sos_alerts";
            
            $statsResult = $this->conn->query($statsQuery);
            $stats = $statsResult->fetch_assoc();

            return [
                'success' => true,
                'alerts' => $alerts,
                'stats' => $stats
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get user activity timeline (all interactions)
    public function getUserActivityTimeline($userId, $limit = 50)
    {
        try {
            // Combine all user activities
            $activities = [];

            // Mood logs
            $moodQuery = "SELECT 'mood' as type, id, created_at, 
                         CONCAT('Logged mood: ', mood_label) as description,
                         mood_emoji as icon
                         FROM mood_logs WHERE user_id = ?";
            $stmt = $this->conn->prepare($moodQuery);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $activities[] = $row;
            }

            // SOS alerts
            $sosQuery = "SELECT 'sos' as type, id, created_at,
                        CONCAT('Triggered SOS alert - Status: ', alert_status) as description,
                        '🆘' as icon
                        FROM sos_alerts WHERE user_id = ?";
            $stmt = $this->conn->prepare($sosQuery);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $activities[] = $row;
            }

            // Sort by date
            usort($activities, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            // Limit results
            $activities = array_slice($activities, 0, $limit);

            return [
                'success' => true,
                'activities' => $activities
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get dashboard summary
    public function getDashboardSummary()
    {
        try {
            $summary = [];

            // Total users
            $usersQuery = "SELECT COUNT(*) as total FROM users";
            $summary['total_users'] = $this->conn->query($usersQuery)->fetch_assoc()['total'];

            // Total mood logs
            $moods = "SELECT COUNT(*) as total FROM mood_logs";
            $summary['total_mood_logs'] = $this->conn->query($moods)->fetch_assoc()['total'];

            // Total SOS alerts
            $sos = "SELECT COUNT(*) as total FROM sos_alerts";
            $summary['total_sos_alerts'] = $this->conn->query($sos)->fetch_assoc()['total'];

            // Active SOS alerts
            $activeSos = "SELECT COUNT(*) as total FROM sos_alerts WHERE alert_status = 'active'";
            $summary['active_sos_alerts'] = $this->conn->query($activeSos)->fetch_assoc()['total'];

            // Today's activity
            $todayMoods = "SELECT COUNT(*) as total FROM mood_logs WHERE DATE(created_at) = CURDATE()";
            $summary['today_mood_logs'] = $this->conn->query($todayMoods)->fetch_assoc()['total'];

            // Average mood (last 7 days)
            $avgMood = "SELECT AVG(mood_level) as avg FROM mood_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            $result = $this->conn->query($avgMood)->fetch_assoc();
            $summary['avg_mood_7days'] = round($result['avg'] ?? 0, 2);

            // Users who logged mood today
            $activeTodayQuery = "SELECT COUNT(DISTINCT user_id) as total FROM mood_logs WHERE DATE(created_at) = CURDATE()";
            $summary['active_users_today'] = $this->conn->query($activeTodayQuery)->fetch_assoc()['total'];

            return [
                'success' => true,
                'summary' => $summary
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Helper function to calculate average mood
    private function getAverageMood($moodLogs)
    {
        if (count($moodLogs) === 0) return 0;
        $total = array_sum(array_column($moodLogs, 'mood_level'));
        return round($total / count($moodLogs), 2);
    }
}

?>
