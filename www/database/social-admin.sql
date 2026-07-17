-- =====================================================
-- CRÉATION TABLES SOCIAL MEDIA - LES GLOUTONNES
-- À exécuter dans phpMyAdmin (base: lesglomsql)
-- =====================================================

-- 1. Table des publications sociales
CREATE TABLE IF NOT EXISTS social_publications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newsletter_campaign_id INT NULL,
    content TEXT NOT NULL,
    hashtags TEXT,
    platforms JSON NOT NULL,
    source ENUM('newsletter_auto', 'manual') DEFAULT 'manual',
    status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft',
    
    -- Métriques Facebook
    facebook_reach INT DEFAULT 0,
    facebook_impressions INT DEFAULT 0,
    facebook_likes INT DEFAULT 0,
    facebook_comments INT DEFAULT 0,
    facebook_shares INT DEFAULT 0,
    facebook_clicks INT DEFAULT 0,
    
    -- Métriques Instagram
    instagram_reach INT DEFAULT 0,
    instagram_impressions INT DEFAULT 0,
    instagram_likes INT DEFAULT 0,
    instagram_comments INT DEFAULT 0,
    instagram_saves INT DEFAULT 0,
    instagram_clicks INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_source_created (source, created_at),
    INDEX idx_status (status),
    INDEX idx_newsletter_campaign (newsletter_campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table des paramètres auto-publication
CREATE TABLE IF NOT EXISTS social_auto_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des hashtags et performance
CREATE TABLE IF NOT EXISTS social_hashtag_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hashtag VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 1,
    total_reach INT DEFAULT 0,
    total_engagement INT DEFAULT 0,
    avg_performance DECIMAL(10,2) DEFAULT 0,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_hashtag (hashtag),
    INDEX idx_performance (avg_performance DESC),
    INDEX idx_last_used (last_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Foreign key vers newsletter_campaigns (si elle existe)
ALTER TABLE social_publications 
ADD CONSTRAINT fk_social_newsletter 
FOREIGN KEY (newsletter_campaign_id) 
REFERENCES newsletter_campaigns(id) 
ON DELETE SET NULL;

-- 5. Paramètres par défaut
INSERT IGNORE INTO social_auto_settings (setting_key, setting_value) VALUES
('enabled', '0'),
('delay_minutes', '30'),
('facebook_enabled', '1'),
('instagram_enabled', '1'),
('custom_hashtags', '#PlantesCarnivoRes #LesGloutonnes');

-- 6. Données de test (optionnel - pour tester le système)
-- Décommente si tu veux des données factices pour tester
/*
INSERT INTO social_publications (
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
    created_at
) VALUES 
(NULL, 'Test publication 1', '#PlantesCarnivoRes #Test', '["facebook", "instagram"]', 'manual', 'published', 150, 12, 3, 89, 15, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(NULL, 'Test publication 2', '#Dionaea #LesGloutonnes', '["facebook"]', 'manual', 'published', 203, 18, 7, 0, 0, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(NULL, 'Test publication 3', '#CarnivorousPlants #Collection', '["instagram"]', 'manual', 'published', 0, 0, 0, 134, 22, DATE_SUB(NOW(), INTERVAL 1 DAY));
*/