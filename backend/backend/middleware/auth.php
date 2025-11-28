<?php
// Authentication Middleware

function generateToken() {
    return bin2hex(random_bytes(32));
}

function verifyToken($token) {
    global $conn;
    
    $query = "SELECT u.id, u.email, u.first_name, u.last_name FROM users u
              JOIN sessions s ON u.id = s.user_id
              WHERE s.token = ? AND s.expires_at > NOW()";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return $result->fetch_assoc();
    }
    
    return false;
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function getAuthToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

function requireAuth() {
    $token = getAuthToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'No authorization token provided'
        ]);
        exit();
    }
    
    $user = verifyToken($token);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired token'
        ]);
        exit();
    }
    
    return $user;
}
?>
