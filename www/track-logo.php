<?php
/**
 * Tracking via Logo - Les Gloutonnes
 * VERSION ANTI-DOUBLONS avec détection intelligente
 */

require_once __DIR__ . '/api/config.php';

try {
    $pdo = getDBConnection();
} catch (RuntimeException $e) {
    redirectToLogo();
}

// Récupérer les paramètres
$campaign_id = (int)($_GET['c'] ?? 0);
$redirect_url = $_GET['r'] ?? '';
$ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

// URL du logo par défaut
$default_logo = 'https://www.lesgloutonnes.be/images/logo/logo.png';
$logo_url = $redirect_url ?: $default_logo;

if (!$campaign_id) {
    redirectToLogo($logo_url);
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
    
    // Email générique pour le logo tracking
    $email_indicator = 'logo-tracking@lesgloutonnes.be';
    
    if ($has_recent_tracking) {
        // Déjà une ouverture récente détectée
        if ($last_method === 'pixel') {
            // Le pixel a déjà tracké, on met juste à jour pour indiquer qu'on a aussi le logo
            $stmt = $pdo->prepare("
                UPDATE newsletter_opens 
                SET tracking_method = 'hybrid', user_agent = CONCAT(user_agent, ' + logo')
                WHERE campaign_id = ? AND ip_address = ? AND opened_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
                ORDER BY opened_at DESC LIMIT 1
            ");
            $stmt->execute([$campaign_id, $ip_address]);
            
            error_log("Logo tracking: Mise à jour vers HYBRID pour campagne $campaign_id, IP $ip_address");
            
        } else {
            // C'est un autre logo tracking, on ignore
            error_log("Logo tracking: IGNORÉ (doublon détecté) pour campagne $campaign_id, IP $ip_address");
        }
        
    } else {
        // Première ouverture détectée, on l'enregistre
        $is_unique = true;
        
        // Vérifier l'unicité globale pour cette campagne + IP (pas seulement 10 min)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM newsletter_opens 
            WHERE campaign_id = ? AND ip_address = ?
        ");
        $stmt->execute([$campaign_id, $ip_address]);
        $global_unique = $stmt->fetch()['count'] == 0;
        
        // Enregistrer l'ouverture
        $stmt = $pdo->prepare("
            INSERT INTO newsletter_opens 
            (campaign_id, email_address, opened_at, ip_address, user_agent, is_unique, tracking_method) 
            VALUES (?, ?, NOW(), ?, ?, ?, 'logo')
        ");
        $stmt->execute([$campaign_id, $email_indicator, $ip_address, $user_agent, $global_unique]);
        
        // Mettre à jour les statistiques seulement si c'est une vraie nouvelle ouverture
        if ($global_unique) {
            updateCampaignStats($campaign_id, $pdo);
        }
        
        error_log("Logo tracking: NOUVELLE ouverture pour campagne $campaign_id, IP $ip_address, Unique: " . ($global_unique ? 'YES' : 'NO'));
    }
    
} catch(Exception $e) {
    error_log("Erreur logo tracking: " . $e->getMessage());
}

// Rediriger vers le logo
redirectToLogo($logo_url);

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
        error_log("Erreur mise à jour stats logo: " . $e->getMessage());
    }
}

/**
 * Rediriger vers le logo
 */
function redirectToLogo($logo_url = null) {
    if (!$logo_url) {
        $logo_url = 'https://www.lesgloutonnes.be/images/logo/logo.png';
    }
    
    // Headers pour redirection vers image
    header('Location: ' . $logo_url);
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    exit;
}

?>