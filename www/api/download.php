<?php
// download.php - Script pour gérer les téléchargements avec compteur

require_once __DIR__ . '/config.php';

// Connexion à la base de données
try {
    $pdo = getDBConnection();
} catch (RuntimeException $e) {
    http_response_code(500);
    exit('Erreur interne du serveur');
}

// Vérifier que le paramètre 'file' est présent
if (!isset($_GET['file'])) {
    http_response_code(400);
    exit('Fichier non spécifié');
}

$fileName = $_GET['file'];

// Sécurité : vérifier que le nom de fichier est valide
if (!preg_match('/^[a-zA-Z0-9._-]+$/', $fileName)) {
    http_response_code(400);
    exit('Nom de fichier invalide');
}

// Récupérer les informations du fichier depuis la base de données
try {
    $stmt = $pdo->prepare("SELECT file_path FROM downloads WHERE file_name = ?");
    $stmt->execute([$fileName]);
    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$file) {
        http_response_code(404);
        exit('Fichier non trouvé');
    }
    
    $filePath = $_SERVER['DOCUMENT_ROOT'] . $file['file_path'];
    
    // Vérifier que le fichier existe physiquement
    if (!file_exists($filePath)) {
        http_response_code(404);
        exit('Fichier physique non trouvé');
    }
    
    // Incrémenter le compteur de téléchargements
    $updateStmt = $pdo->prepare("UPDATE downloads SET download_count = download_count + 1 WHERE file_name = ?");
    $updateStmt->execute([$fileName]);
    
    // Forcer le téléchargement du fichier
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filePath));
    
    // Nettoyer les buffers de sortie
    ob_clean();
    flush();
    
    // Lire et envoyer le fichier
    readfile($filePath);
    exit;
    
} catch(PDOException $e) {
    error_log("Erreur lors du téléchargement: " . $e->getMessage());
    http_response_code(500);
    exit('Erreur lors du téléchargement');
}
?>