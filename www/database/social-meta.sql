-- =====================================================
-- TABLES META BUSINESS SUITE - LES GLOUTONNES
-- Version Complète - Toutes les tables et données
-- =====================================================

-- Table pour les statistiques Facebook actuelles
CREATE TABLE IF NOT EXISTS meta_facebook_current (
    id INT AUTO_INCREMENT PRIMARY KEY,
    views INT DEFAULT 0,
    reach INT DEFAULT 0,
    interactions INT DEFAULT 0,
    new_followers INT DEFAULT 0,
    views_growth DECIMAL(5,2) DEFAULT 0,
    reach_growth DECIMAL(5,2) DEFAULT 0,
    interactions_growth DECIMAL(5,2) DEFAULT 0,
    followers_growth DECIMAL(5,2) DEFAULT 0,
    follower_percentage INT DEFAULT 0,
    period VARCHAR(100) DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les statistiques Instagram actuelles
CREATE TABLE IF NOT EXISTS meta_instagram_current (
    id INT AUTO_INCREMENT PRIMARY KEY,
    views INT DEFAULT 0,
    reach INT DEFAULT 0,
    interactions INT DEFAULT 0,
    new_followers INT DEFAULT 0,
    views_growth DECIMAL(5,2) DEFAULT 0,
    reach_growth DECIMAL(5,2) DEFAULT 0,
    interactions_growth DECIMAL(5,2) DEFAULT 0,
    followers_growth DECIMAL(5,2) DEFAULT 0,
    follower_percentage INT DEFAULT 0,
    period VARCHAR(100) DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table historique pour Facebook
CREATE TABLE IF NOT EXISTS meta_facebook_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    views INT DEFAULT 0,
    reach INT DEFAULT 0,
    interactions INT DEFAULT 0,
    new_followers INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- Table historique pour Instagram
CREATE TABLE IF NOT EXISTS meta_instagram_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    views INT DEFAULT 0,
    reach INT DEFAULT 0,
    interactions INT DEFAULT 0,
    new_followers INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- Table pour logs d'import
CREATE TABLE IF NOT EXISTS meta_import_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    platform VARCHAR(20) NOT NULL,
    data_imported JSON,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT NULL
);

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Créer les index (ignorer les erreurs si ils existent déjà)
CREATE INDEX idx_facebook_updated ON meta_facebook_current(updated_at);
CREATE INDEX idx_instagram_updated ON meta_instagram_current(updated_at);
CREATE INDEX idx_facebook_history_date ON meta_facebook_history(date);
CREATE INDEX idx_instagram_history_date ON meta_instagram_history(date);

-- =====================================================
-- FONCTION POUR CALCULER LE TAUX D'ENGAGEMENT
-- =====================================================

DELIMITER //
DROP FUNCTION IF EXISTS CalculateEngagementRate //
CREATE FUNCTION CalculateEngagementRate(interactions INT, reach INT) 
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE engagement_rate DECIMAL(5,2) DEFAULT 0;
    
    IF reach > 0 THEN
        SET engagement_rate = (interactions / reach) * 100;
    END IF;
    
    RETURN engagement_rate;
END //
DELIMITER ;

-- =====================================================
-- PROCÉDURE POUR ARCHIVER LES DONNÉES
-- =====================================================

DELIMITER //
DROP PROCEDURE IF EXISTS ArchiveCurrentStats //
CREATE PROCEDURE ArchiveCurrentStats()
BEGIN
    -- Archiver Facebook
    INSERT INTO meta_facebook_history (date, views, reach, interactions, new_followers)
    SELECT CURDATE(), views, reach, interactions, new_followers
    FROM meta_facebook_current 
    WHERE id = (SELECT MAX(id) FROM meta_facebook_current)
    ON DUPLICATE KEY UPDATE
    views = VALUES(views),
    reach = VALUES(reach),
    interactions = VALUES(interactions),
    new_followers = VALUES(new_followers);
    
    -- Archiver Instagram
    INSERT INTO meta_instagram_history (date, views, reach, interactions, new_followers)
    SELECT CURDATE(), views, reach, interactions, new_followers
    FROM meta_instagram_current 
    WHERE id = (SELECT MAX(id) FROM meta_instagram_current)
    ON DUPLICATE KEY UPDATE
    views = VALUES(views),
    reach = VALUES(reach),
    interactions = VALUES(interactions),
    new_followers = VALUES(new_followers);
END //
DELIMITER ;

-- =====================================================
-- VUES POUR LE DASHBOARD
-- =====================================================

-- Vue pour les KPIs principaux
DROP VIEW IF EXISTS meta_kpi_summary;
CREATE VIEW meta_kpi_summary AS
SELECT 
    -- Facebook KPIs
    COALESCE(fb.views, 0) as facebook_views,
    COALESCE(fb.reach, 0) as facebook_reach,
    COALESCE(fb.interactions, 0) as facebook_interactions,
    COALESCE(fb.new_followers, 0) as facebook_new_followers,
    CalculateEngagementRate(COALESCE(fb.interactions, 0), COALESCE(fb.reach, 1)) as facebook_engagement_rate,
    
    -- Instagram KPIs  
    COALESCE(ig.views, 0) as instagram_views,
    COALESCE(ig.reach, 0) as instagram_reach,
    COALESCE(ig.interactions, 0) as instagram_interactions,
    COALESCE(ig.new_followers, 0) as instagram_new_followers,
    CalculateEngagementRate(COALESCE(ig.interactions, 0), COALESCE(ig.reach, 1)) as instagram_engagement_rate,
    
    -- Totaux combinés
    (COALESCE(fb.views, 0) + COALESCE(ig.views, 0)) as total_views,
    (COALESCE(fb.reach, 0) + COALESCE(ig.reach, 0)) as total_reach,
    (COALESCE(fb.interactions, 0) + COALESCE(ig.interactions, 0)) as total_interactions,
    (COALESCE(fb.new_followers, 0) + COALESCE(ig.new_followers, 0)) as total_new_followers,
    CalculateEngagementRate(
        (COALESCE(fb.interactions, 0) + COALESCE(ig.interactions, 0)), 
        GREATEST((COALESCE(fb.reach, 0) + COALESCE(ig.reach, 0)), 1)
    ) as combined_engagement_rate,
    
    -- Tendances
    COALESCE(fb.views_growth, 0) as facebook_views_trend,
    COALESCE(fb.reach_growth, 0) as facebook_reach_trend,
    COALESCE(fb.interactions_growth, 0) as facebook_interactions_trend,
    COALESCE(ig.views_growth, 0) as instagram_views_trend,
    COALESCE(ig.reach_growth, 0) as instagram_reach_trend,
    COALESCE(ig.interactions_growth, 0) as instagram_interactions_trend,
    
    -- Platforme dominante
    CASE 
        WHEN COALESCE(fb.interactions, 0) > COALESCE(ig.interactions, 0) THEN 'Facebook'
        WHEN COALESCE(ig.interactions, 0) > COALESCE(fb.interactions, 0) THEN 'Instagram'
        ELSE 'Égal'
    END as dominant_platform,
    
    -- Dernière mise à jour
    GREATEST(COALESCE(fb.updated_at, '1970-01-01'), COALESCE(ig.updated_at, '1970-01-01')) as last_update,
    
    -- Période de données
    COALESCE(fb.period, 'Aucune donnée') as data_period
    
FROM 
    (SELECT * FROM meta_facebook_current ORDER BY id DESC LIMIT 1) fb
    CROSS JOIN
    (SELECT * FROM meta_instagram_current ORDER BY id DESC LIMIT 1) ig;

-- Vue pour les alertes et recommandations
DROP VIEW IF EXISTS meta_alerts;
CREATE VIEW meta_alerts AS
SELECT 
    CASE
        WHEN facebook_interactions_trend < -50 THEN 'CRITIQUE: Chute drastique engagement Facebook'
        WHEN instagram_interactions_trend < -50 THEN 'CRITIQUE: Chute drastique engagement Instagram'
        WHEN facebook_reach_trend < -30 THEN 'ATTENTION: Baisse portée Facebook'
        WHEN instagram_reach_trend < -30 THEN 'ATTENTION: Baisse portée Instagram'
        WHEN facebook_views_trend > 100 THEN 'SUCCÈS: Explosion des vues Facebook !'
        WHEN instagram_views_trend > 100 THEN 'SUCCÈS: Explosion des vues Instagram !'
        WHEN combined_engagement_rate > 10 THEN 'EXCELLENT: Taux engagement élevé'
        WHEN combined_engagement_rate < 1 THEN 'AMÉLIORER: Taux engagement faible'
        ELSE 'NORMAL: Performance stable'
    END as alert_message,
    
    CASE
        WHEN facebook_interactions_trend < -50 OR instagram_interactions_trend < -50 THEN 'critical'
        WHEN facebook_reach_trend < -30 OR instagram_reach_trend < -30 THEN 'warning'
        WHEN facebook_views_trend > 100 OR instagram_views_trend > 100 THEN 'success'
        WHEN combined_engagement_rate > 10 THEN 'success'
        WHEN combined_engagement_rate < 1 THEN 'warning'
        ELSE 'info'
    END as alert_type,
    
    -- Actions recommandées
    CASE
        WHEN facebook_interactions_trend < -50 THEN 'Réviser stratégie contenu Facebook'
        WHEN instagram_interactions_trend < -50 THEN 'Réviser stratégie contenu Instagram'
        WHEN combined_engagement_rate < 1 THEN 'Augmenter interactions: questions, sondages'
        WHEN dominant_platform = 'Facebook' THEN 'Renforcer stratégie Instagram'
        WHEN dominant_platform = 'Instagram' THEN 'Renforcer stratégie Facebook'
        ELSE 'Maintenir la stratégie actuelle'
    END as recommended_action,
    
    last_update
FROM meta_kpi_summary;

-- Vue pour le dashboard - données combinées
DROP VIEW IF EXISTS meta_dashboard_stats;
CREATE VIEW meta_dashboard_stats AS
SELECT 
    'combined' as platform,
    COALESCE(f.views, 0) + COALESCE(i.views, 0) as total_views,
    COALESCE(f.reach, 0) + COALESCE(i.reach, 0) as total_reach,
    COALESCE(f.interactions, 0) + COALESCE(i.interactions, 0) as total_interactions,
    COALESCE(f.new_followers, 0) + COALESCE(i.new_followers, 0) as total_new_followers,
    f.views as facebook_views,
    f.reach as facebook_reach,
    f.interactions as facebook_interactions,
    f.new_followers as facebook_new_followers,
    f.views_growth as facebook_views_growth,
    f.reach_growth as facebook_reach_growth,
    f.interactions_growth as facebook_interactions_growth,
    f.followers_growth as facebook_followers_growth,
    i.views as instagram_views,
    i.reach as instagram_reach,
    i.interactions as instagram_interactions,
    i.new_followers as instagram_new_followers,
    i.views_growth as instagram_views_growth,
    i.reach_growth as instagram_reach_growth,
    i.interactions_growth as instagram_interactions_growth,
    i.followers_growth as instagram_followers_growth,
    GREATEST(COALESCE(f.updated_at, '1970-01-01'), COALESCE(i.updated_at, '1970-01-01')) as last_update
FROM 
    (SELECT * FROM meta_facebook_current ORDER BY updated_at DESC LIMIT 1) f
    CROSS JOIN
    (SELECT * FROM meta_instagram_current ORDER BY updated_at DESC LIMIT 1) i;

-- =====================================================
-- INSERTION DES DONNÉES DE TEST (TES VRAIES STATS)
-- =====================================================

-- Facebook - Tes vraies statistiques
INSERT INTO meta_facebook_current 
(views, reach, interactions, new_followers, views_growth, reach_growth, interactions_growth, followers_growth, follower_percentage, period)
VALUES 
(3800, 1300, 158, 12, 24.6, 58.1, 107.9, 200.0, 34, '1 mai - 28 mai 2025')
ON DUPLICATE KEY UPDATE
views = VALUES(views),
reach = VALUES(reach),
interactions = VALUES(interactions),
new_followers = VALUES(new_followers),
views_growth = VALUES(views_growth),
reach_growth = VALUES(reach_growth),
interactions_growth = VALUES(interactions_growth),
followers_growth = VALUES(followers_growth),
follower_percentage = VALUES(follower_percentage),
period = VALUES(period);

-- Instagram - Tes vraies statistiques
INSERT INTO meta_instagram_current 
(views, reach, interactions, new_followers, views_growth, reach_growth, interactions_growth, followers_growth, follower_percentage, period)
VALUES 
(197, 58, 20, 4, 198.5, 1400.0, 400.0, -20.0, 93, '1 mai - 28 mai 2025')
ON DUPLICATE KEY UPDATE
views = VALUES(views),
reach = VALUES(reach),
interactions = VALUES(interactions),
new_followers = VALUES(new_followers),
views_growth = VALUES(views_growth),
reach_growth = VALUES(reach_growth),
interactions_growth = VALUES(interactions_growth),
followers_growth = VALUES(followers_growth),
follower_percentage = VALUES(follower_percentage),
period = VALUES(period);

-- =====================================================
-- REQUÊTES DE TEST (DÉCOMMENTE POUR TESTER)
-- =====================================================

-- Voir les KPIs calculés
-- SELECT * FROM meta_kpi_summary;

-- Voir les alertes générées automatiquement  
-- SELECT * FROM meta_alerts;

-- Voir les données du dashboard
-- SELECT * FROM meta_dashboard_stats;

-- Test de la fonction d'engagement
-- SELECT CalculateEngagementRate(158, 1300) as 'Taux Facebook', CalculateEngagementRate(20, 58) as 'Taux Instagram';

-- =====================================================
-- FIN DU SCRIPT
-- Les Gloutonnes - Meta Business Suite Integration
-- Version 1.0 - Script complet prêt pour production
-- =====================================================