<?php
/**
 * Traitement simple du formulaire bonus
 * api/process-form.php
 */

require_once 'config.php';

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Méthode non autorisée');
}

try {
    // Récupérer les données du formulaire
    $prenom = trim($_POST['prenom'] ?? '');
    $nom = trim($_POST['nom'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $newsletter = isset($_POST['newsletter']); // true si case cochée
    
    // Validation basique
    if (empty($prenom) || empty($nom) || empty($email)) {
        sendJsonResponse(false, 'Tous les champs sont requis');
    }
    
    if (!isValidEmail($email)) {
        sendJsonResponse(false, 'Format d\'email invalide');
    }
    
    // Si la case newsletter est cochée, ajouter en base
    if ($newsletter) {
        $pdo = getDBConnection();
        
        // Vérifier si l'email existe déjà
        $stmt = $pdo->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
        $stmt->execute([strtolower($email)]);
        
        if (!$stmt->fetch()) {
            // Ajouter le nouvel abonné
            $stmt = $pdo->prepare("
                INSERT INTO newsletter_subscribers (email, prenom, nom) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([strtolower($email), $prenom, $nom]);
        }
    }
    
    // Succès
    sendJsonResponse(true, 'Inscription réussie ! Tu peux télécharger ton guide.');
    
} catch (PDOException $e) {
    error_log("Erreur BDD bonus: " . $e->getMessage());
    sendJsonResponse(false, 'Erreur technique, réessaie plus tard');
    
} catch (Exception $e) {
    error_log("Erreur bonus: " . $e->getMessage());
    sendJsonResponse(false, 'Une erreur s\'est produite');
}
?>