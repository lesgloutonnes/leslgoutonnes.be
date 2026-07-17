<?php
/**
 * API simple pour l'administration newsletter
 * php/admin-api.php
 * VERSION AMÉLIORÉE avec sécurité, rate limiting, pagination
 */

require_once 'config.php';
require_once 'helpers.php';

// Démarrer session pour CSRF
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Clé d'accès depuis config (variable d'environnement)
$ADMIN_KEY = defined('AUTO_EMAIL_ADMIN_KEY') && AUTO_EMAIL_ADMIN_KEY 
    ? AUTO_EMAIL_ADMIN_KEY 
    : 'gloutonnes2025'; // Fallback pour compatibilité

// Vérifier la clé d'accès
$provided_key = $_GET['key'] ?? $_POST['key'] ?? '';
if ($provided_key !== $ADMIN_KEY) {
    error_log("Tentative d'accès non autorisée à admin-api.php depuis IP: " . getClientIp());
    sendJsonResponse(false, 'Accès non autorisé');
}

// Rate limiting par IP et action
$ip = getClientIp();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rateLimitKey = 'admin_api_' . $ip . '_' . $action;

// Limites différentes selon l'action
$rateLimits = [
    'get_subscribers' => [100, 60], // 100 requêtes / minute
    'search_subscribers' => [50, 60], // 50 requêtes / minute
    'add_subscriber' => [20, 3600], // 20 requêtes / heure
    'remove_subscriber' => [20, 3600], // 20 requêtes / heure
    'export_csv' => [10, 3600], // 10 requêtes / heure
];

$limit = $rateLimits[$action] ?? [30, 60]; // Par défaut: 30/min
if (isRateLimited($rateLimitKey, $limit[0], $limit[1])) {
    http_response_code(429);
    sendJsonResponse(false, 'Trop de requêtes. Réessayez plus tard.');
}

try {
    switch ($action) {
        case 'get_subscribers':
            getSubscribers();
            break;
            
        case 'add_subscriber':
            addSubscriber();
            break;
            
        case 'remove_subscriber':
            removeSubscriber();
            break;
            
        case 'search_subscribers':
            searchSubscribers();
            break;
            
        case 'export_csv':
            exportCSV();
            break;
            
        default:
            sendJsonResponse(false, 'Action non reconnue');
    }
    
} catch (Exception $e) {
    error_log("Erreur admin API: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendJsonResponse(false, 'Erreur serveur: ' . $e->getMessage());
}

/**
 * Récupérer tous les abonnés avec pagination
 */
function getSubscribers() {
    try {
        $pdo = getDBConnection();
        
        // Pagination
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 50))); // Entre 10 et 100
        $offset = ($page - 1) * $limit;
        
        // Compter le total
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM newsletter_subscribers");
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Récupérer les abonnés (LIMIT et OFFSET doivent être des entiers directement dans la requête)
        $limit = (int)$limit;
        $offset = (int)$offset;
        $stmt = $pdo->prepare("
            SELECT id, email, prenom, nom, date_inscription 
            FROM newsletter_subscribers 
            ORDER BY date_inscription DESC
            LIMIT {$limit} OFFSET {$offset}
        ");
        $stmt->execute();
        $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendJsonResponse(true, 'Abonnés récupérés', [
            'subscribers' => $subscribers,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit)
            ]
        ]);
    } catch (Exception $e) {
        error_log("Erreur getSubscribers: " . $e->getMessage());
        sendJsonResponse(false, 'Erreur lors de la récupération des abonnés: ' . $e->getMessage());
    }
}

/**
 * Ajouter un abonné avec validation renforcée
 */
function addSubscriber() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJsonResponse(false, 'Méthode POST requise');
    }
    
    $email = trim($_POST['email'] ?? '');
    $prenom = trim($_POST['prenom'] ?? 'Admin');
    $nom = trim($_POST['nom'] ?? 'Ajout');
    
    // Validation stricte
    if (empty($email)) {
        sendJsonResponse(false, 'Email requis');
    }
    
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    if (!isValidEmail($email)) {
        sendJsonResponse(false, 'Format d\'email invalide');
    }
    
    $email = strtolower($email);
    
    // Blacklist serveur
    $blacklist = ['test@', 'example@', 'noreply@', 'no-reply@', 'admin@', 'root@', 'postmaster@'];
    foreach ($blacklist as $blocked) {
        if (strpos($email, $blocked) !== false) {
            sendJsonResponse(false, 'Email non autorisé');
        }
    }
    
    // Validation longueur
    if (strlen($email) > 254 || strlen($email) < 5) {
        sendJsonResponse(false, 'Email invalide (longueur)');
    }
    
    // Sanitization prénom/nom
    $prenom = sanitizeText($prenom);
    $nom = sanitizeText($nom);
    
    if (strlen($prenom) > 100 || strlen($nom) > 100) {
        sendJsonResponse(false, 'Prénom ou nom trop long');
    }
    
    $pdo = getDBConnection();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO newsletter_subscribers (email, prenom, nom) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$email, $prenom, $nom]);
        
        error_log("Nouvel abonné ajouté: $email depuis IP: " . getClientIp());
        sendJsonResponse(true, 'Abonné ajouté avec succès');
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            sendJsonResponse(false, 'Cet email est déjà inscrit');
        } else {
            error_log("Erreur ajout abonné: " . $e->getMessage());
            sendJsonResponse(false, 'Erreur lors de l\'ajout');
        }
    }
}

/**
 * Supprimer un abonné
 */
function removeSubscriber() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJsonResponse(false, 'Méthode POST requise');
    }
    
    $email = trim($_POST['email'] ?? '');
    
    if (empty($email)) {
        sendJsonResponse(false, 'Email requis');
    }
    
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("DELETE FROM newsletter_subscribers WHERE email = ?");
    $stmt->execute([strtolower($email)]);
    
    if ($stmt->rowCount() > 0) {
        sendJsonResponse(true, 'Abonné supprimé');
    } else {
        sendJsonResponse(false, 'Abonné introuvable');
    }
}

/**
 * Rechercher des abonnés avec pagination
 */
function searchSubscribers() {
    $search = trim($_GET['q'] ?? '');
    
    $pdo = getDBConnection();
    
    if (empty($search) || strlen($search) < 2) {
        // Retourner tous si pas de recherche ou recherche trop courte
        getSubscribers();
        return;
    }
    
    // Limiter la longueur de recherche
    $search = mb_substr($search, 0, 100);
    
    // Pagination
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    
    // Compter le total
    $searchTerm = '%' . $search . '%';
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM newsletter_subscribers 
        WHERE email LIKE ? OR prenom LIKE ? OR nom LIKE ?
    ");
    $countStmt->execute([$searchTerm, $searchTerm, $searchTerm]);
    $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Recherche avec pagination (LIMIT et OFFSET doivent être des entiers directement dans la requête)
    $limit = (int)$limit;
    $offset = (int)$offset;
    $stmt = $pdo->prepare("
        SELECT id, email, prenom, nom, date_inscription 
        FROM newsletter_subscribers 
        WHERE email LIKE ? OR prenom LIKE ? OR nom LIKE ?
        ORDER BY date_inscription DESC
        LIMIT {$limit} OFFSET {$offset}
    ");
    
    $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
    $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendJsonResponse(true, 'Recherche effectuée', [
        'subscribers' => $subscribers,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => (int)ceil($total / $limit)
        ]
    ]);
}

/**
 * Exporter en CSV
 */
function exportCSV() {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT email, prenom, nom, date_inscription 
        FROM newsletter_subscribers 
        ORDER BY date_inscription DESC
    ");
    $stmt->execute();
    $subscribers = $stmt->fetchAll();
    
    // Générer le CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="newsletter_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // En-têtes
    fputcsv($output, ['Email', 'Prénom', 'Nom', 'Date inscription']);
    
    // Données
    foreach ($subscribers as $subscriber) {
        fputcsv($output, [
            $subscriber['email'],
            $subscriber['prenom'],
            $subscriber['nom'],
            $subscriber['date_inscription']
        ]);
    }
    
    fclose($output);
    exit;
}
?>