-- Structure de la base de données pour le compteur de téléchargements
-- Base de données : lesglomsql

-- Utiliser la base de données
USE lesglomsql;

CREATE TABLE IF NOT EXISTS downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_file (file_name)
);

-- Insérer le fichier du gestionnaire de collection
INSERT INTO downloads (file_name, file_path, download_count) 
VALUES ('Carnivorous_Plants_Collection_1.0.zip', '/images/applications/Carnivorous_Plants_Collection_1.0.zip', 586)
ON DUPLICATE KEY UPDATE download_count = 586;