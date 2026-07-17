<?php
/**
 * Génération et validation de tokens CSRF
 */

require_once 'config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Génère un token CSRF et le stocke en session
 */
function generateCSRFToken(): string {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    
    // Régénérer le token toutes les heures
    if (isset($_SESSION['csrf_token_time']) && (time() - $_SESSION['csrf_token_time']) > 3600) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Valide un token CSRF
 */
function validateCSRFToken(string $token): bool {
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    // Vérifier que le token n'est pas trop vieux (2 heures max)
    if (isset($_SESSION['csrf_token_time']) && (time() - $_SESSION['csrf_token_time']) > 7200) {
        unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}

// Endpoint pour récupérer le token
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'token' => generateCSRFToken()
    ]);
    exit;
}

// Endpoint pour valider le token
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['token'] ?? '';
    header('Content-Type: application/json');
    echo json_encode([
        'success' => validateCSRFToken($token),
        'valid' => validateCSRFToken($token)
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);

