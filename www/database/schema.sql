-- Créer la base de données si elle n'existe pas déjà
CREATE DATABASE IF NOT EXISTS lesglomsql;

-- Utiliser la base de données
USE lesglomsql;

-- Créer la table des rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    visitors INT NOT NULL,
    interested_plants TEXT,
    message TEXT,
    status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer un index sur la date de rendez-vous pour les recherches rapides
CREATE INDEX idx_appointment_date ON appointments(appointment_date);

-- Créer un index sur le statut pour filtrer facilement
CREATE INDEX idx_status ON appointments(status);

-- Créer une table pour les créneaux horaires disponibles (facultatif)
CREATE TABLE IF NOT EXISTS available_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week TINYINT NOT NULL COMMENT '0=Dimanche, 1=Lundi, etc.',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_visitors INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les créneaux horaires par défaut
INSERT INTO available_slots (day_of_week, start_time, end_time, max_visitors) VALUES
-- Lundi à Vendredi (16h30-19h30)
(1, '16:30:00', '17:30:00', 10),
(1, '17:30:00', '18:30:00', 10),
(1, '18:30:00', '19:30:00', 10),
(2, '16:30:00', '17:30:00', 10),
(2, '17:30:00', '18:30:00', 10),
(2, '18:30:00', '19:30:00', 10),
(3, '16:30:00', '17:30:00', 10),
(3, '17:30:00', '18:30:00', 10),
(3, '18:30:00', '19:30:00', 10),
(4, '16:30:00', '17:30:00', 10),
(4, '17:30:00', '18:30:00', 10),
(4, '18:30:00', '19:30:00', 10),
(5, '16:30:00', '17:30:00', 10),
(5, '17:30:00', '18:30:00', 10),
(5, '18:30:00', '19:30:00', 10),
-- Samedi et Dimanche (10h-20h)
(0, '10:00:00', '11:00:00', 10),
(0, '11:00:00', '12:00:00', 10),
(0, '12:00:00', '13:00:00', 10),
(0, '13:00:00', '14:00:00', 10),
(0, '14:00:00', '15:00:00', 10),
(0, '15:00:00', '16:00:00', 10),
(0, '16:00:00', '17:00:00', 10),
(0, '17:00:00', '18:00:00', 10),
(0, '18:00:00', '19:00:00', 10),
(0, '19:00:00', '20:00:00', 10),
(6, '10:00:00', '11:00:00', 10),
(6, '11:00:00', '12:00:00', 10),
(6, '12:00:00', '13:00:00', 10),
(6, '13:00:00', '14:00:00', 10),
(6, '14:00:00', '15:00:00', 10),
(6, '15:00:00', '16:00:00', 10),
(6, '16:00:00', '17:00:00', 10),
(6, '17:00:00', '18:00:00', 10),
(6, '18:00:00', '19:00:00', 10),
(6, '19:00:00', '20:00:00', 10);

-- Créer une table pour les utilisateurs admin (pour un éventuel panneau d'administration)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;