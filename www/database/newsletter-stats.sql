-- Nouvelles tables pour le système de statistiques Les Gloutonnes
-- À exécuter sur ta base de données MySQL

-- Utiliser la base de données
USE lesglomsql;

-- Table pour l'historique des campagnes
CREATE TABLE IF NOT EXISTS `newsletter_campaigns` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `campaign_name` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `content_preview` TEXT,
  `total_sent` INT DEFAULT 0,
  `batch_number` INT DEFAULT 1,
  `sent_date` DATETIME NOT NULL,
  `created_by` VARCHAR(100) DEFAULT 'Charles',
  `status` ENUM('draft', 'sent', 'archived') DEFAULT 'sent',
  PRIMARY KEY (`id`),
  INDEX `idx_sent_date` (`sent_date`),
  INDEX `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Table pour le tracking des ouvertures d'emails
CREATE TABLE IF NOT EXISTS `newsletter_opens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `campaign_id` INT NOT NULL,
  `email_address` VARCHAR(255) NOT NULL,
  `opened_at` DATETIME NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `is_unique` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns`(`id`) ON DELETE CASCADE,
  INDEX `idx_campaign_email` (`campaign_id`, `email_address`),
  INDEX `idx_opened_at` (`opened_at`),
  INDEX `idx_unique_opens` (`campaign_id`, `email_address`, `is_unique`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Table pour les statistiques agrégées par campagne (pour des performances optimales)
CREATE TABLE IF NOT EXISTS `newsletter_campaign_stats` (
  `campaign_id` INT NOT NULL,
  `total_opens` INT DEFAULT 0,
  `unique_opens` INT DEFAULT 0,
  `open_rate` DECIMAL(5,2) DEFAULT 0.00,
  `last_updated` DATETIME NOT NULL,
  PRIMARY KEY (`campaign_id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Insérer quelques données de test pour la démo
INSERT INTO `newsletter_campaigns` 
(`campaign_name`, `subject`, `content_preview`, `total_sent`, `sent_date`, `status`) 
VALUES 
('Nouvelles Dionaea disponibles', 'Découvre mes nouvelles créations Dionaea !', 'Salut ! J\'ai de superbes nouvelles Dionaea à te présenter...', 209, '2025-01-15 14:30:00', 'sent'),
('Guide culture hiver', 'Prendre soin de tes plantes carnivores en hiver', 'L\'hiver arrive et tes plantes carnivores ont besoin d\'attention...', 205, '2025-01-08 10:15:00', 'sent'),
('Événements janvier', 'Mes prochains événements et bourses aux plantes', 'Je serai présent dans plusieurs bourses ce mois-ci...', 201, '2025-01-02 16:45:00', 'sent'),
('Nouveautés décembre', 'Les dernières acquisitions pour ma collection', 'Décembre a été un mois riche en nouvelles découvertes...', 198, '2024-12-18 11:30:00', 'sent');

-- Insérer des statistiques de test
INSERT INTO `newsletter_campaign_stats` 
(`campaign_id`, `total_opens`, `unique_opens`, `open_rate`, `last_updated`) 
VALUES 
(1, 201, 159, 76.08, '2025-01-15 18:00:00'),
(2, 143, 127, 62.00, '2025-01-08 15:30:00'),
(3, 134, 117, 58.21, '2025-01-02 20:15:00'),
(4, 167, 141, 71.21, '2024-12-18 16:45:00');

-- Insérer quelques ouvertures de test pour la démo
INSERT INTO `newsletter_opens` 
(`campaign_id`, `email_address`, `opened_at`, `ip_address`, `is_unique`) 
VALUES 
(1, 'marie.d***@gmail.com', '2025-01-15 14:35:00', '192.168.1.100', TRUE),
(1, 'jean.p***@hotmail.com', '2025-01-15 14:42:00', '192.168.1.101', TRUE),
(1, 'sophie.l***@outlook.be', '2025-01-15 15:12:00', '192.168.1.102', TRUE),
(1, 'marie.d***@gmail.com', '2025-01-15 16:20:00', '192.168.1.100', FALSE),
(2, 'marie.d***@gmail.com', '2025-01-08 10:25:00', '192.168.1.100', TRUE),
(2, 'lucas.m***@yahoo.fr', '2025-01-08 11:15:00', '192.168.1.103', TRUE);