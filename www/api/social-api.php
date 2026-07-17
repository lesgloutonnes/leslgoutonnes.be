<?php
/**
 * API Social Media - Les Gloutonnes
 * VERSION ROBUSTE avec gestion d'erreurs, validation et logging
 * Gère les publications sociales, brouillons, hashtags et auto-publication
 * VERSION AMÉLIORÉE avec rate limiting, sécurité renforcée
 */

require_once 'config.php';
require_once 'helpers.php';

ini_set('memory_limit', '64M');
ini_set('max_execution_time', 30);

// Démarrer session pour CSRF si nécessaire
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===============================
// CONFIGURATION ET SÉCURITÉ
// ===============================

$admin_key = defined('AUTO_EMAIL_ADMIN_KEY') && AUTO_EMAIL_ADMIN_KEY 
    ? AUTO_EMAIL_ADMIN_KEY 
    : 'gloutonnes2025'; // Fallback

$key = $_GET['key'] ?? $_POST['key'] ?? '';
if ($key !== $admin_key) {
    $ip = getClientIp();
    error_log("Tentative d'accès non autorisée à social-api.php depuis IP: " . $ip);
    sendError("Accès refusé");
}

// Rate limiting par IP et action
$ip = getClientIp();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rateLimitKey = 'social_api_' . $ip . '_' . $action;

// Limites différentes selon l'action
$rateLimits = [
    'get_drafts' => [50, 60], // 50 requêtes / minute
    'get_publications' => [50, 60],
    'get_hashtag_stats' => [30, 60],
    'get_auto_settings' => [30, 60],
    'save_draft' => [20, 60], // 20 requêtes / minute
    'save_publication' => [20, 60],
    'create_auto_publication' => [10, 3600], // 10 requêtes / heure
    'update_hashtag_performance' => [30, 60],
];

$limit = $rateLimits[$action] ?? [30, 60]; // Par défaut: 30/min
if (isRateLimited($rateLimitKey, $limit[0], $limit[1])) {
    http_response_code(429);
    sendError('Trop de requêtes. Réessayez plus tard.');
}

try {
    $pdo = getDBConnection();
} catch (RuntimeException $e) {
    error_log("Erreur connexion DB social-api: " . $e->getMessage());
    sendError("Connexion impossible");
}

// ===============================
// ROUTAGE DES ACTIONS
// ===============================

switch ($action) {
    case 'create_auto_publication':
        createAutoPublication();
        break;
    
    case 'save_draft':
        saveDraft();
        break;
    
    case 'get_drafts':
        getDrafts();
        break;
    
    case 'delete_draft':
        deleteDraft();
        break;
    
    case 'save_publication':
        savePublication();
        break;
    
    case 'get_publications':
        getPublications();
        break;
    
    case 'update_hashtag_performance':
        updateHashtagPerformance();
        break;
    
    case 'get_hashtag_stats':
        getHashtagStats();
        break;
    
    case 'get_auto_settings':
        getAutoSettings();
        break;
    
    case 'update_auto_settings':
        updateAutoSettings();
        break;
    
    case 'get_publication_stats':
        getPublicationStats();
        break;
    
    default:
        sendError("Action inconnue: " . $action);
}

// ===============================
// FONCTIONS UTILITAIRES
// ===============================

function sendSuccess($data, $message = '') {
    $response = [
        'success' => true,
        'data' => $data
    ];
    if ($message) {
        $response['message'] = $message;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function validateCampaignId($campaign_id) {
    global $pdo;
    
    if (empty($campaign_id)) {
        return false;
    }
    
    $campaign_id = (int)$campaign_id;
    if ($campaign_id <= 0) {
        return false;
    }
    
    // Vérifier que la campagne existe
    try {
        $stmt = $pdo->prepare("SELECT id FROM newsletter_campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        error_log("Erreur validation campagne: " . $e->getMessage());
        return false;
    }
}

function sanitizeContent($content) {
    // Nettoyer le contenu mais garder les emojis et caractères spéciaux
    $content = trim($content);
    $content = htmlspecialchars($content, ENT_QUOTES, 'UTF-8');
    return $content;
}

function extractHashtags($text) {
    preg_match_all('/#(\w+)/u', $text, $matches);
    return array_unique($matches[1] ?? []);
}

// ===============================
// AUTO-PUBLICATION DEPUIS NEWSLETTER
// ===============================

function createAutoPublication() {
    global $pdo;
    
    try {
        // Récupérer les paramètres d'auto-publication
        $stmt = $pdo->prepare("SELECT setting_value FROM social_auto_settings WHERE setting_key = 'enabled'");
        $stmt->execute();
        $enabled = $stmt->fetchColumn();
        
        if ($enabled !== '1') {
            sendSuccess([
                'created' => false,
                'reason' => 'Auto-publication désactivée'
            ], 'Auto-publication désactivée dans les paramètres');
        }
        
        // Validation des données
        $campaign_id = (int)($_POST['campaign_id'] ?? 0);
        $newsletter_title = trim($_POST['newsletter_title'] ?? '');
        $newsletter_intro = trim($_POST['newsletter_intro'] ?? '');
        $newsletter_link = trim($_POST['newsletter_link'] ?? '');
        
        if (!$campaign_id || !$newsletter_title) {
            sendError("Données manquantes: campaign_id et newsletter_title requis");
        }
        
        if (!validateCampaignId($campaign_id)) {
            sendError("Campagne invalide");
        }
        
        // Vérifier si une publication existe déjà pour cette campagne
        $stmt = $pdo->prepare("
            SELECT id FROM social_publications 
            WHERE newsletter_campaign_id = ? AND source = 'newsletter_auto'
        ");
        $stmt->execute([$campaign_id]);
        if ($stmt->fetch()) {
            sendSuccess([
                'created' => false,
                'reason' => 'Publication déjà créée pour cette campagne'
            ], 'Publication déjà existante');
        }
        
        // Générer le contenu de la publication
        $content = generateSocialContent($newsletter_title, $newsletter_intro, $newsletter_link);
        
        // Récupérer les hashtags par défaut
        $stmt = $pdo->prepare("SELECT setting_value FROM social_auto_settings WHERE setting_key = 'custom_hashtags'");
        $stmt->execute();
        $defaultHashtags = $stmt->fetchColumn() ?: '#PlantesCarnivoRes #LesGloutonnes';
        
        // Extraire hashtags du contenu
        $contentHashtags = extractHashtags($content);
        $allHashtags = array_merge(
            explode(' ', $defaultHashtags),
            array_map(function($h) { return '#' . $h; }, $contentHashtags)
        );
        $hashtags = implode(' ', array_unique($allHashtags));
        
        // Déterminer les plateformes
        $platforms = [];
        $stmt = $pdo->prepare("SELECT setting_value FROM social_auto_settings WHERE setting_key = 'facebook_enabled'");
        $stmt->execute();
        if ($stmt->fetchColumn() === '1') {
            $platforms[] = 'facebook';
        }
        
        $stmt = $pdo->prepare("SELECT setting_value FROM social_auto_settings WHERE setting_key = 'instagram_enabled'");
        $stmt->execute();
        if ($stmt->fetchColumn() === '1') {
            $platforms[] = 'instagram';
        }
        
        if (empty($platforms)) {
            sendError("Aucune plateforme activée");
        }
        
        // Calculer l'heure de publication (délai configuré)
        $stmt = $pdo->prepare("SELECT setting_value FROM social_auto_settings WHERE setting_key = 'delay_minutes'");
        $stmt->execute();
        $delayMinutes = (int)($stmt->fetchColumn() ?: 30);
        
        $scheduled_at = date('Y-m-d H:i:s', strtotime("+{$delayMinutes} minutes"));
        
        // Insérer la publication
        $stmt = $pdo->prepare("
            INSERT INTO social_publications 
            (newsletter_campaign_id, content, hashtags, platforms, source, status, scheduled_at)
            VALUES (?, ?, ?, ?, 'newsletter_auto', 'scheduled', ?)
        ");
        
        $platformsJson = json_encode($platforms, JSON_UNESCAPED_UNICODE);
        $stmt->execute([
            $campaign_id,
            sanitizeContent($content),
            $hashtags,
            $platformsJson,
            $scheduled_at
        ]);
        
        $publication_id = $pdo->lastInsertId();
        
        // Mettre à jour les performances des hashtags
        updateHashtagsFromText($hashtags);
        
        // Log de l'action
        error_log("Auto-publication créée: ID {$publication_id}, Campagne {$campaign_id}, Programmée: {$scheduled_at}");
        
        sendSuccess([
            'created' => true,
            'publication_id' => $publication_id,
            'scheduled_time' => $scheduled_at,
            'platforms' => $platforms,
            'content_preview' => mb_substr($content, 0, 100) . '...'
        ], 'Publication sociale programmée avec succès');
        
    } catch (Exception $e) {
        error_log("Erreur createAutoPublication: " . $e->getMessage());
        sendError("Erreur lors de la création: " . $e->getMessage());
    }
}

function generateSocialContent($title, $intro, $link) {
    $content = "📧 Nouvelle newsletter disponible !\n\n";
    
    if ($title) {
        $content .= "✨ {$title}\n\n";
    }
    
    if ($intro) {
        // Limiter l'intro à 200 caractères pour les réseaux sociaux
        $introShort = mb_strlen($intro) > 200 
            ? mb_substr($intro, 0, 197) . '...' 
            : $intro;
        $content .= "{$introShort}\n\n";
    }
    
    if ($link) {
        $content .= "🔗 Découvre la newsletter complète : {$link}";
    }
    
    return $content;
}

// ===============================
// GESTION DES BROUILLONS
// ===============================

function saveDraft() {
    global $pdo;
    
    try {
        $content = trim($_POST['content'] ?? '');
        $hashtags = trim($_POST['hashtags'] ?? '');
        $campaign_id = !empty($_POST['campaign_id']) ? (int)$_POST['campaign_id'] : null;
        
        if (empty($content)) {
            sendError("Le contenu est requis");
        }
        
        // Si campaign_id fourni, valider
        if ($campaign_id && !validateCampaignId($campaign_id)) {
            sendError("Campagne invalide");
        }
        
        // Extraire hashtags du contenu si non fournis
        if (empty($hashtags)) {
            $extracted = extractHashtags($content);
            $hashtags = implode(' ', array_map(function($h) { return '#' . $h; }, $extracted));
        }
        
        // Déterminer les plateformes (par défaut les deux)
        $platforms = ['facebook', 'instagram'];
        if (!empty($_POST['platforms'])) {
            $platforms = json_decode($_POST['platforms'], true) ?: $platforms;
        }
        
        // Vérifier s'il existe déjà un brouillon récent (moins de 1 heure)
        $stmt = $pdo->prepare("
            SELECT id FROM social_publications 
            WHERE status = 'draft' AND source = 'manual' 
            AND updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY updated_at DESC LIMIT 1
        ");
        $stmt->execute();
        $existingDraft = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $platformsJson = json_encode($platforms, JSON_UNESCAPED_UNICODE);
        
        if ($existingDraft) {
            // Mettre à jour le brouillon existant
            $draft_id = $existingDraft['id'];
            $stmt = $pdo->prepare("
                UPDATE social_publications 
                SET content = ?, hashtags = ?, platforms = ?, 
                    newsletter_campaign_id = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                sanitizeContent($content),
                $hashtags,
                $platformsJson,
                $campaign_id,
                $draft_id
            ]);
        } else {
            // Créer un nouveau brouillon
            $stmt = $pdo->prepare("
                INSERT INTO social_publications 
                (newsletter_campaign_id, content, hashtags, platforms, source, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'manual', 'draft', NOW(), NOW())
            ");
            $stmt->execute([
                $campaign_id,
                sanitizeContent($content),
                $hashtags,
                $platformsJson
            ]);
            $draft_id = $pdo->lastInsertId();
        }
        
        sendSuccess([
            'draft_id' => $draft_id,
            'saved_at' => date('Y-m-d H:i:s')
        ], 'Brouillon sauvegardé');
        
    } catch (Exception $e) {
        error_log("Erreur saveDraft: " . $e->getMessage());
        sendError("Erreur lors de la sauvegarde: " . $e->getMessage());
    }
}

function getDrafts() {
    global $pdo;
    
    try {
        $limit = (int)($_GET['limit'] ?? 20);
        $limit = min(max($limit, 1), 100); // Entre 1 et 100
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                newsletter_campaign_id,
                content,
                hashtags,
                platforms,
                created_at,
                updated_at
            FROM social_publications
            WHERE status = 'draft' AND source = 'manual'
            ORDER BY updated_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $drafts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Décoder les plateformes JSON
        foreach ($drafts as &$draft) {
            $draft['platforms'] = json_decode($draft['platforms'], true) ?: [];
        }
        
        sendSuccess($drafts);
        
    } catch (Exception $e) {
        error_log("Erreur getDrafts: " . $e->getMessage());
        sendError("Erreur lors de la récupération: " . $e->getMessage());
    }
}

function deleteDraft() {
    global $pdo;
    
    try {
        $draft_id = (int)($_POST['draft_id'] ?? 0);
        
        if ($draft_id <= 0) {
            sendError("ID de brouillon invalide");
        }
        
        $stmt = $pdo->prepare("
            DELETE FROM social_publications 
            WHERE id = ? AND status = 'draft' AND source = 'manual'
        ");
        $stmt->execute([$draft_id]);
        
        if ($stmt->rowCount() === 0) {
            sendError("Brouillon non trouvé ou déjà supprimé");
        }
        
        sendSuccess(['deleted' => true], 'Brouillon supprimé');
        
    } catch (Exception $e) {
        error_log("Erreur deleteDraft: " . $e->getMessage());
        sendError("Erreur lors de la suppression: " . $e->getMessage());
    }
}

// ===============================
// GESTION DES PUBLICATIONS
// ===============================

function savePublication() {
    global $pdo;
    
    try {
        $publication_id = !empty($_POST['publication_id']) ? (int)$_POST['publication_id'] : null;
        $content = trim($_POST['content'] ?? '');
        $hashtags = trim($_POST['hashtags'] ?? '');
        $platforms = json_decode($_POST['platforms'] ?? '[]', true) ?: ['facebook', 'instagram'];
        $status = $_POST['status'] ?? 'draft';
        $campaign_id = !empty($_POST['campaign_id']) ? (int)$_POST['campaign_id'] : null;
        
        if (empty($content)) {
            sendError("Le contenu est requis");
        }
        
        // Valider le statut
        $validStatuses = ['draft', 'scheduled', 'published', 'failed'];
        if (!in_array($status, $validStatuses)) {
            sendError("Statut invalide");
        }
        
        // Valider les plateformes
        $validPlatforms = ['facebook', 'instagram'];
        $platforms = array_intersect($platforms, $validPlatforms);
        if (empty($platforms)) {
            sendError("Au moins une plateforme valide est requise");
        }
        
        if ($publication_id) {
            // Mise à jour
            $stmt = $pdo->prepare("
                UPDATE social_publications 
                SET content = ?, hashtags = ?, platforms = ?, status = ?, 
                    newsletter_campaign_id = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                sanitizeContent($content),
                $hashtags,
                json_encode($platforms, JSON_UNESCAPED_UNICODE),
                $status,
                $campaign_id,
                $publication_id
            ]);
        } else {
            // Création
            $stmt = $pdo->prepare("
                INSERT INTO social_publications 
                (newsletter_campaign_id, content, hashtags, platforms, source, status)
                VALUES (?, ?, ?, ?, 'manual', ?)
            ");
            $stmt->execute([
                $campaign_id,
                sanitizeContent($content),
                $hashtags,
                json_encode($platforms, JSON_UNESCAPED_UNICODE),
                $status
            ]);
            $publication_id = $pdo->lastInsertId();
        }
        
        // Mettre à jour les performances des hashtags
        if (!empty($hashtags)) {
            updateHashtagsFromText($hashtags);
        }
        
        sendSuccess([
            'publication_id' => $publication_id,
            'status' => $status
        ], $publication_id ? 'Publication mise à jour' : 'Publication créée');
        
    } catch (Exception $e) {
        error_log("Erreur savePublication: " . $e->getMessage());
        sendError("Erreur lors de la sauvegarde: " . $e->getMessage());
    }
}

function getPublications() {
    global $pdo;
    
    try {
        $limit = (int)($_GET['limit'] ?? 20);
        $limit = min(max($limit, 1), 100);
        $status = $_GET['status'] ?? null;
        $source = $_GET['source'] ?? null;
        
        $sql = "
            SELECT 
                id,
                newsletter_campaign_id,
                content,
                hashtags,
                platforms,
                source,
                status,
                facebook_reach,
                facebook_likes,
                facebook_comments,
                instagram_reach,
                instagram_likes,
                instagram_comments,
                created_at,
                scheduled_at,
                published_at,
                updated_at
            FROM social_publications
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        if ($source) {
            $sql .= " AND source = ?";
            $params[] = $source;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $publications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Décoder les plateformes JSON
        foreach ($publications as &$pub) {
            $pub['platforms'] = json_decode($pub['platforms'], true) ?: [];
        }
        
        sendSuccess($publications);
        
    } catch (Exception $e) {
        error_log("Erreur getPublications: " . $e->getMessage());
        sendError("Erreur lors de la récupération: " . $e->getMessage());
    }
}

// ===============================
// GESTION DES HASHTAGS
// ===============================

function updateHashtagsFromText($hashtagsText) {
    global $pdo;
    
    if (empty($hashtagsText)) {
        return;
    }
    
    $hashtags = extractHashtags($hashtagsText);
    
    foreach ($hashtags as $hashtag) {
        $hashtag = '#' . strtolower($hashtag);
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO social_hashtag_performance 
                (hashtag, usage_count, last_used)
                VALUES (?, 1, NOW())
                ON DUPLICATE KEY UPDATE
                    usage_count = usage_count + 1,
                    last_used = NOW(),
                    updated_at = NOW()
            ");
            $stmt->execute([$hashtag]);
        } catch (Exception $e) {
            error_log("Erreur updateHashtag: {$hashtag} - " . $e->getMessage());
        }
    }
}

function updateHashtagPerformance() {
    global $pdo;
    
    try {
        $hashtag = trim($_POST['hashtag'] ?? '');
        $reach = (int)($_POST['reach'] ?? 0);
        $engagement = (int)($_POST['engagement'] ?? 0);
        
        if (empty($hashtag)) {
            sendError("Hashtag requis");
        }
        
        // Normaliser le hashtag
        if (substr($hashtag, 0, 1) !== '#') {
            $hashtag = '#' . $hashtag;
        }
        $hashtag = strtolower($hashtag);
        
        // Récupérer les stats actuelles
        $stmt = $pdo->prepare("
            SELECT usage_count, total_reach, total_engagement 
            FROM social_hashtag_performance 
            WHERE hashtag = ?
        ");
        $stmt->execute([$hashtag]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($current) {
            $newTotalReach = $current['total_reach'] + $reach;
            $newTotalEngagement = $current['total_engagement'] + $engagement;
            $newUsageCount = $current['usage_count'] + 1;
            $avgPerformance = $newUsageCount > 0 
                ? round(($newTotalEngagement / $newTotalReach) * 100, 2) 
                : 0;
            
            $stmt = $pdo->prepare("
                UPDATE social_hashtag_performance 
                SET usage_count = ?,
                    total_reach = ?,
                    total_engagement = ?,
                    avg_performance = ?,
                    last_used = NOW(),
                    updated_at = NOW()
                WHERE hashtag = ?
            ");
            $stmt->execute([
                $newUsageCount,
                $newTotalReach,
                $newTotalEngagement,
                $avgPerformance,
                $hashtag
            ]);
        } else {
            $avgPerformance = $reach > 0 ? round(($engagement / $reach) * 100, 2) : 0;
            
            $stmt = $pdo->prepare("
                INSERT INTO social_hashtag_performance 
                (hashtag, usage_count, total_reach, total_engagement, avg_performance, last_used)
                VALUES (?, 1, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $hashtag,
                $reach,
                $engagement,
                $avgPerformance
            ]);
        }
        
        sendSuccess([
            'hashtag' => $hashtag,
            'updated' => true
        ], 'Performance hashtag mise à jour');
        
    } catch (Exception $e) {
        error_log("Erreur updateHashtagPerformance: " . $e->getMessage());
        sendError("Erreur lors de la mise à jour: " . $e->getMessage());
    }
}

function getHashtagStats() {
    global $pdo;
    
    try {
        $limit = (int)($_GET['limit'] ?? 20);
        $limit = min(max($limit, 1), 100);
        $orderBy = $_GET['order_by'] ?? 'usage_count'; // usage_count, avg_performance, last_used
        
        $validOrderBy = ['usage_count', 'avg_performance', 'last_used', 'total_reach', 'total_engagement'];
        if (!in_array($orderBy, $validOrderBy)) {
            $orderBy = 'usage_count';
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                hashtag,
                usage_count,
                total_reach,
                total_engagement,
                avg_performance,
                last_used
            FROM social_hashtag_performance
            ORDER BY {$orderBy} DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendSuccess($stats);
        
    } catch (Exception $e) {
        error_log("Erreur getHashtagStats: " . $e->getMessage());
        sendError("Erreur lors de la récupération: " . $e->getMessage());
    }
}

// ===============================
// PARAMÈTRES AUTO-PUBLICATION
// ===============================

function getAutoSettings() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT setting_key, setting_value 
            FROM social_auto_settings
        ");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        sendSuccess($settings);
        
    } catch (Exception $e) {
        error_log("Erreur getAutoSettings: " . $e->getMessage());
        sendError("Erreur lors de la récupération: " . $e->getMessage());
    }
}

function updateAutoSettings() {
    global $pdo;
    
    try {
        $settings = $_POST['settings'] ?? [];
        
        if (empty($settings) || !is_array($settings)) {
            sendError("Paramètres invalides");
        }
        
        $pdo->beginTransaction();
        
        foreach ($settings as $key => $value) {
            $key = trim($key);
            $value = trim($value);
            
            if (empty($key)) {
                continue;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO social_auto_settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    setting_value = VALUES(setting_value),
                    updated_at = NOW()
            ");
            $stmt->execute([$key, $value]);
        }
        
        $pdo->commit();
        
        sendSuccess(['updated' => true], 'Paramètres mis à jour');
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Erreur updateAutoSettings: " . $e->getMessage());
        sendError("Erreur lors de la mise à jour: " . $e->getMessage());
    }
}

// ===============================
// STATISTIQUES PUBLICATIONS
// ===============================

function getPublicationStats() {
    global $pdo;
    
    try {
        // Stats globales
        $stmt = $pdo->query("
            SELECT 
                COUNT(*) as total_publications,
                COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
                COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
                COUNT(CASE WHEN source = 'newsletter_auto' THEN 1 END) as auto_publications,
                SUM(facebook_reach + instagram_reach) as total_reach,
                SUM(facebook_likes + instagram_likes) as total_likes,
                SUM(facebook_comments + instagram_comments) as total_comments
            FROM social_publications
        ");
        $global = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Top hashtags
        $stmt = $pdo->query("
            SELECT hashtag, usage_count, avg_performance
            FROM social_hashtag_performance
            ORDER BY usage_count DESC
            LIMIT 10
        ");
        $topHashtags = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Publications récentes
        $stmt = $pdo->query("
            SELECT id, content, status, created_at, 
                   (facebook_reach + instagram_reach) as total_reach
            FROM social_publications
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendSuccess([
            'global' => $global,
            'top_hashtags' => $topHashtags,
            'recent_publications' => $recent
        ]);
        
    } catch (Exception $e) {
        error_log("Erreur getPublicationStats: " . $e->getMessage());
        sendError("Erreur lors de la récupération: " . $e->getMessage());
    }
}

?>

