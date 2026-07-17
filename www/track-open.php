<?php
/**
 * Pixel de tracking des ouvertures d'emails - Les Gloutonnes
 * VERSION ANTI-DOUBLONS avec détection intelligente
 */

require_once __DIR__ . '/api/config.php';

try {
    $pdo = getDBConnection();
} catch (RuntimeException $e) {
    outputTrackingPixel();
    exit;
}

// Récupérer les paramètres
$campaign_id = (int)($_GET['c'] ?? 0);
$email_hash = $_GET['e'] ?? '';
$ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

if (!$campaign_id || !$email_hash) {
    outputTrackingPixel();
    exit;
}

// Décoder l'email
$email_address = base64_decode($email_hash);

if (!filter_var($email_address, FILTER_VALIDATE_EMAIL)) {
    outputTrackingPixel();
    exit;
}

try {
    // ANTI-DOUBLONS : Vérifier si on a déjà un tracking pour cette campagne + IP dans les dernières 10 minutes
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count, MAX(tracking_method) as last_method
        FROM newsletter_opens 
        WHERE campaign_id = ? 
        AND ip_address = ? 
        AND opened_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    ");
    $stmt->execute([$campaign_id, $ip_address]);
    $existing = $stmt->fetch();
    
    $has_recent_tracking = $existing['count'] > 0;
    $last_method = $existing['last_method'];
    
    // Vérifier si c'est une ouverture unique pour cet email spécifique
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM newsletter_opens 
        WHERE campaign_id = ? AND email_address = ?
    ");
    $stmt->execute([$campaign_id, $email_address]);
    $is_unique = $stmt->fetch()['count'] == 0;
    
    if ($has_recent_tracking) {
        // Déjà une ouverture récente détectée
        if ($last_method === 'logo') {
            // Le logo a déjà tracké, on met juste à jour pour indiquer qu'on a aussi le pixel
            $stmt = $pdo->prepare("
                UPDATE newsletter_opens 
                SET tracking_method = 'hybrid', email_address = ?, user_agent = CONCAT(user_agent, ' + pixel')
                WHERE campaign_id = ? AND ip_address = ? AND opened_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
                ORDER BY opened_at DESC LIMIT 1
            ");
            $stmt->execute([$email_address, $campaign_id, $ip_address]);
            
            error_log("Pixel tracking: Mise à jour vers HYBRID pour campagne $campaign_id, email $email_address");
            
        } else {
            // C'est un autre pixel tracking ou déjà hybrid, on ignore
            error_log("Pixel tracking: IGNORÉ (doublon détecté) pour campagne $campaign_id, email $email_address");
        }
        
    } else {
        // Première ouverture détectée, on l'enregistre
        $stmt = $pdo->prepare("
            INSERT INTO newsletter_opens 
            (campaign_id, email_address, opened_at, ip_address, user_agent, is_unique, tracking_method) 
            VALUES (?, ?, NOW(), ?, ?, ?, 'pixel')
        ");
        $stmt->execute([$campaign_id, $email_address, $ip_address, $user_agent, $is_unique]);
        
        // Mettre à jour les statistiques seulement si c'est une vraie nouvelle ouverture
        if ($is_unique) {
            updateCampaignStats($campaign_id, $pdo);
        }
        
        error_log("Pixel tracking: NOUVELLE ouverture pour campagne $campaign_id, email $email_address, Unique: " . ($is_unique ? 'YES' : 'NO'));
    }
    
} catch(Exception $e) {
    error_log("Erreur tracking: " . $e->getMessage());
}

// Retourner le pixel de tracking
outputTrackingPixel();

/**
 * Mettre à jour les statistiques d'une campagne
 */
function updateCampaignStats($campaign_id, $pdo) {
    try {
        // Compter les ouvertures UNIQUES seulement (éviter les doublons)
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_opens,
                COUNT(CASE WHEN is_unique = 1 THEN 1 END) as unique_opens
            FROM newsletter_opens 
            WHERE campaign_id = ?
        ");
        $stmt->execute([$campaign_id]);
        $opens = $stmt->fetch();
        
        // Récupérer le total envoyé
        $stmt = $pdo->prepare("SELECT total_sent FROM newsletter_campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $campaign = $stmt->fetch();
        $total_sent = (int)($campaign['total_sent'] ?? 0);
        
        // Calculer le taux d'ouverture : (ouvertures uniques / total envoyé) * 100
        // S'assurer que unique_opens est bien un entier
        $unique_opens = (int)($opens['unique_opens'] ?? 0);
        
        // Éviter la division par zéro et limiter à 100% maximum
        if ($total_sent > 0) {
            $open_rate = min(100, round(($unique_opens / $total_sent) * 100, 2));
        } else {
            $open_rate = 0;
        }
        
        // Mettre à jour les stats
        $stmt = $pdo->prepare("
            UPDATE newsletter_campaign_stats 
            SET total_opens = ?, unique_opens = ?, open_rate = ?, last_updated = NOW() 
            WHERE campaign_id = ?
        ");
        $stmt->execute([$opens['total_opens'], $opens['unique_opens'], $open_rate, $campaign_id]);
        
    } catch(Exception $e) {
        error_log("Erreur mise à jour stats: " . $e->getMessage());
    }
}

/**
 * Retourner un pixel de tracking transparent
 */
function outputTrackingPixel() {
    header('Content-Type: image/gif');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Pixel transparent 1x1
    echo base64_decode('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
}

?>