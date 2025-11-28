<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

class AuthController {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['first_name'])) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'Email, password, and first name are required'
            ];
        }
        
        $email = $data['email'];
        $password = $data['password'];
        $first_name = $data['first_name'];
        $last_name = $data['last_name'] ?? '';
        $phone = $data['phone'] ?? '';
        
        // Check if user already exists
        $checkQuery = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($checkQuery);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            http_response_code(409);
            return [
                'success' => false,
                'message' => 'Email already registered'
            ];
        }
        
        $hashedPassword = hashPassword($password);
        
        $insertQuery = "INSERT INTO users (email, password, first_name, last_name, phone) 
                        VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($insertQuery);
        $stmt->bind_param("sssss", $email, $hashedPassword, $first_name, $last_name, $phone);
        
        if ($stmt->execute()) {
            $user_id = $this->conn->insert_id;
            
            // Generate session token
            $token = generateToken();
            $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
            $ip = $_SERVER['REMOTE_ADDR'];
            $userAgent = $_SERVER['HTTP_USER_AGENT'];
            
            $sessionQuery = "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
                            VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sessionQuery);
            $stmt->bind_param("issss", $user_id, $token, $ip, $userAgent, $expires);
            $stmt->execute();
            
            return [
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $user_id,
                    'email' => $email,
                    'first_name' => $first_name,
                    'last_name' => $last_name
                ],
                'token' => $token
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Registration failed: ' . $this->conn->error
            ];
        }
    }
    
    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'Email and password are required'
            ];
        }
        
        $email = $data['email'];
        $password = $data['password'];
        
        $query = "SELECT id, password, first_name, last_name FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(401);
            return [
                'success' => false,
                'message' => 'Invalid email or password'
            ];
        }
        
        $user = $result->fetch_assoc();
        
        if (!verifyPassword($password, $user['password'])) {
            http_response_code(401);
            return [
                'success' => false,
                'message' => 'Invalid email or password'
            ];
        }
        
        // Generate session token
        $token = generateToken();
        $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
        $ip = $_SERVER['REMOTE_ADDR'];
        $userAgent = $_SERVER['HTTP_USER_AGENT'];
        $user_id = $user['id'];
        
        $sessionQuery = "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
                        VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sessionQuery);
        $stmt->bind_param("issss", $user_id, $token, $ip, $userAgent, $expires);
        $stmt->execute();
        
        return [
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'email' => $email,
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name']
            ],
            'token' => $token
        ];
    }
    
    public function logout() {
        $token = getAuthToken();
        
        if (!$token) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'No token provided'
            ];
        }
        
        $query = "DELETE FROM sessions WHERE token = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $token);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Logged out successfully'
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Logout failed'
            ];
        }
    }
}
?>
