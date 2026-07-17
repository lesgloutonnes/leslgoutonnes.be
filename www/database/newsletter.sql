-- Table simple pour les abonnés newsletter
-- Base: lesglomsql

-- Utiliser la base de données
USE lesglomsql;

CREATE TABLE newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    prenom VARCHAR(100) DEFAULT NULL,
    nom VARCHAR(100) DEFAULT NULL,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;