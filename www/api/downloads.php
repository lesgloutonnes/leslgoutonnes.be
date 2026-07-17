<?php
// api/downloads.php - API pour récupérer le nombre de téléchargements
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

try {
    $pdo = getDBConnection();
    
    // Si un fichier spécifique est demandé
    if (isset($_GET['file'])) {
        $fileName = $_GET['file'];
        $stmt = $pdo->prepare("SELECT file_name, download_count FROM downloads WHERE file_name = ?");
        $stmt->execute([$fileName]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'file_name' => $result['file_name'],
                'download_count' => (int)$result['download_count']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Fichier non trouvé'
            ]);
        }
    } else {
        // Récupérer tous les compteurs
        $stmt = $pdo->query("SELECT file_name, download_count FROM downloads ORDER BY file_name");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'downloads' => $results
        ]);
    }
    
} catch(PDOException $e) {
    error_log("Erreur API downloads: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur interne du serveur'
    ]);
}
?>