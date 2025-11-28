<?php
// ===============================================
// GOOGLE OAUTH ENDPOINT
// ===============================================

require_once __DIR__ . '/../cors.php';          // CORS FIRST
require_once __DIR__ . '/../bootstrap.php';     // env + helpers
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$authController = new AuthController($conn);
$method = $_SERVER['REQUEST_METHOD'];

// Only allow POST
if ($method !== 'POST') {
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

// Read JSON body
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['credential'])) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Google credential not provided'
    ]);
}

$googleToken = $data['credential'];

// ======================================================
// VERIFY GOOGLE ID TOKEN USING GOOGLE TOKENINFO API
// ======================================================
$tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($googleToken);
$tokenResponse = @file_get_contents($tokenInfoUrl);

if ($tokenResponse === false) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Invalid Google token'
    ]);
}

$tokenData = json_decode($tokenResponse, true);

// Validate token structure
if (!isset($tokenData['aud'], $tokenData['sub'])) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Invalid Google token data'
    ]);
}

// Check audience matches backend env
$clientId = getenv('GOOGLE_OAUTH_CLIENT_ID');
if (!$clientId) {
    jsonResponse(500, [
        'success' => false,
        'message' => 'Server misconfigured: GOOGLE_OAUTH_CLIENT_ID missing'
    ]);
}

if ($tokenData['aud'] !== $clientId) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Invalid Google client ID'
    ]);
}

// Check expiration
if (time() > $tokenData['exp']) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Google token has expired'
    ]);
}

// Extract user info
$googleId        = $tokenData['sub'];
$email           = $tokenData['email'] ?? '';
$firstName       = $tokenData['given_name'] ?? '';
$lastName        = $tokenData['family_name'] ?? '';
$profilePicture  = $tokenData['picture'] ?? '';

if (!$email) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Google account did not return an email'
    ]);
}

// ======================================================
// PASS USER DATA TO AUTH CONTROLLER
// ======================================================
try {
    $user = $authController->handleGoogleLogin(
        $googleId,
        $email,
        $firstName,
        $lastName,
        $profilePicture
    );

    jsonResponse(200, [
        'success'             => true,
        'message'             => 'Login successful',
        'token'               => $user['token'],
        'user'                => $user['data'],
        'needs_profile_setup' => $user['needs_profile_setup']
    ]);

} catch (Exception $e) {
    jsonResponse(500, [
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
