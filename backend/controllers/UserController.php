<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

class UserController {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    public function getProfile() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $query = "SELECT id, email, first_name, last_name, phone, date_of_birth, gender, 
                         campus, emergency_contact_name, emergency_contact_phone, 
                         profile_picture, is_active, created_at FROM users WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return [
                'success' => true,
                'data' => $result->fetch_assoc()
            ];
        } else {
            http_response_code(404);
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }
    }
    
    public function updateProfile() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $first_name = $data['first_name'] ?? null;
        $last_name = $data['last_name'] ?? null;
        $phone = $data['phone'] ?? null;
        $date_of_birth = $data['date_of_birth'] ?? null;
        $gender = $data['gender'] ?? null;
        $campus = $data['campus'] ?? null;
        $hostel = $data['hostel'] ?? null;
        $introduction = $data['introduction'] ?? null;
        $preferences = $data['preferences'] ?? null;
        $emergency_contact_name = $data['emergency_contact_name'] ?? null;
        $emergency_contact_phone = $data['emergency_contact_phone'] ?? null;
        
        $updateFields = [];
        $params = [];
        $types = "";
        
        if ($first_name !== null) {
            $updateFields[] = "first_name = ?";
            $params[] = $first_name;
            $types .= "s";
        }
        if ($last_name !== null) {
            $updateFields[] = "last_name = ?";
            $params[] = $last_name;
            $types .= "s";
        }
        if ($phone !== null) {
            $updateFields[] = "phone = ?";
            $params[] = $phone;
            $types .= "s";
        }
        if ($date_of_birth !== null) {
            $updateFields[] = "date_of_birth = ?";
            $params[] = $date_of_birth;
            $types .= "s";
        }
        if ($gender !== null) {
            $updateFields[] = "gender = ?";
            $params[] = $gender;
            $types .= "s";
        }
        if ($campus !== null) {
            $updateFields[] = "campus = ?";
            $params[] = $campus;
            $types .= "s";
        }
        if ($hostel !== null) {
            $updateFields[] = "hostel = ?";
            $params[] = $hostel;
            $types .= "s";
        }
        if ($introduction !== null) {
            $updateFields[] = "introduction = ?";
            $params[] = $introduction;
            $types .= "s";
        }
        if ($preferences !== null) {
            // Store preferences as JSON
            $preferencesJson = is_array($preferences) ? json_encode($preferences) : $preferences;
            $updateFields[] = "preferences = ?";
            $params[] = $preferencesJson;
            $types .= "s";
        }
        if ($emergency_contact_name !== null) {
            $updateFields[] = "emergency_contact_name = ?";
            $params[] = $emergency_contact_name;
            $types .= "s";
        }
        if ($emergency_contact_phone !== null) {
            $updateFields[] = "emergency_contact_phone = ?";
            $params[] = $emergency_contact_phone;
            $types .= "s";
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'No fields to update'
            ];
        }
        
        $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
        
        $query = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $params[] = $user_id;
        $types .= "i";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            // Log activity: Profile updated
            $activityStmt = $this->conn->prepare("
                INSERT INTO user_activity_logs 
                (user_id, activity_type, activity_description, metadata, created_at) 
                VALUES (?, 'profile_update', 'User updated profile information', ?, NOW())
            ");
            $updatedFields = [];
            if ($first_name !== null) $updatedFields[] = 'first_name';
            if ($last_name !== null) $updatedFields[] = 'last_name';
            if ($phone !== null) $updatedFields[] = 'phone';
            if ($hostel !== null) $updatedFields[] = 'hostel';
            if ($introduction !== null) $updatedFields[] = 'introduction';
            if ($preferences !== null) $updatedFields[] = 'preferences';
            
            $metadata = json_encode([
                'updated_fields' => $updatedFields,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            $activityStmt->bind_param("is", $user_id, $metadata);
            $activityStmt->execute();
            
            return [
                'success' => true,
                'message' => 'Profile updated successfully'
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Update failed: ' . $this->conn->error
            ];
        }
    }
    
    public function addTrustedContact() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['contact_name'])) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'Contact name is required'
            ];
        }
        
        $contact_name = $data['contact_name'];
        $contact_email = $data['contact_email'] ?? null;
        $contact_phone = $data['contact_phone'] ?? null;
        
        // Get user's current trusted contacts
        $query = "SELECT trusted_contacts FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user_data = $result->fetch_assoc();
        
        $contacts = json_decode($user_data['trusted_contacts'] ?? '[]', true);
        
        // Add new contact
        $contacts[] = [
            'contact_name' => $contact_name,
            'contact_email' => $contact_email,
            'contact_phone' => $contact_phone,
            'added_at' => date('Y-m-d H:i:s')
        ];
        
        $contactsJson = json_encode($contacts);
        
        $updateQuery = "UPDATE users SET trusted_contacts = ? WHERE id = ?";
        $stmt = $this->conn->prepare($updateQuery);
        $stmt->bind_param("si", $contactsJson, $user_id);
        
        if ($stmt->execute()) {
            // Add IDs for return
            $contactsWithIds = [];
            foreach ($contacts as $index => $contact) {
                $contact['id'] = $index;
                $contactsWithIds[] = $contact;
            }
            
            return [
                'success' => true,
                'message' => 'Trusted contact added successfully',
                'contacts' => $contactsWithIds
            ];
        } else {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Failed to add contact'
            ];
        }
    }
    
    public function getTrustedContacts() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $query = "SELECT trusted_contacts FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user_data = $result->fetch_assoc();
        
        $contacts = json_decode($user_data['trusted_contacts'] ?? '[]', true);
        
        // Add IDs to contacts for frontend management
        $contactsWithIds = [];
        foreach ($contacts as $index => $contact) {
            $contact['id'] = $index;
            $contactsWithIds[] = $contact;
        }
        
        return [
            'success' => true,
            'contacts' => $contactsWithIds
        ];
    }
    
    public function deleteTrustedContact() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['contact_id'])) {
            http_response_code(400);
            return [
                'success' => false,
                'message' => 'Contact ID is required'
            ];
        }
        
        $contact_id = $data['contact_id'];
        
        // Get user's current trusted contacts
        $query = "SELECT trusted_contacts FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user_data = $result->fetch_assoc();
        
        $contacts = json_decode($user_data['trusted_contacts'] ?? '[]', true);
        
        // Remove contact by index
        if (isset($contacts[$contact_id])) {
            array_splice($contacts, $contact_id, 1);
            
            $contactsJson = json_encode($contacts);
            
            $updateQuery = "UPDATE users SET trusted_contacts = ? WHERE id = ?";
            $stmt = $this->conn->prepare($updateQuery);
            $stmt->bind_param("si", $contactsJson, $user_id);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Trusted contact removed successfully',
                    'contacts' => $contacts
                ];
            } else {
                http_response_code(500);
                return [
                    'success' => false,
                    'message' => 'Failed to remove contact'
                ];
            }
        } else {
            http_response_code(404);
            return [
                'success' => false,
                'message' => 'Contact not found'
            ];
        }
    }
    
    // Update user's last active timestamp
    public function updateLastActive() {
        $user = requireAuth();
        $user_id = $user['id'];
        
        $query = "UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Activity tracked'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Failed to update activity'
            ];
        }
    }
}
?>
