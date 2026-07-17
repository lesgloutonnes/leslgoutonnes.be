<?php
/**
 * Générateur d'emails automatiques avec lots
 * auto-email-generator.php
 */

require_once __DIR__ . '/config.php';

// Clé d'accès
$adminKey = defined('AUTO_EMAIL_ADMIN_KEY') ? AUTO_EMAIL_ADMIN_KEY : null;
$provided_key = $_GET['key'] ?? '';

if (empty($adminKey)) {
    http_response_code(500);
    die("Accès non configuré. Contacte l'administrateur pour définir AUTO_EMAIL_ADMIN_KEY.");
}

if (!hash_equals($adminKey, (string) $provided_key)) {
    http_response_code(403);
    die("Accès non autorisé");
}

$action = $_POST['action'] ?? 'form';
$batchSize = 45; // Sécurisé pour Outlook

// Traitement du formulaire
if ($action === 'generate') {
    $newsletterData = [
        'subject' => $_POST['subject'] ?? '',
        'title' => $_POST['title'] ?? '',
        'intro' => $_POST['intro'] ?? '',
        'content' => $_POST['content'] ?? '',
        'ctaText' => $_POST['ctaText'] ?? '',
        'ctaLink' => $_POST['ctaLink'] ?? ''
    ];
    
    generateEmailLinks($newsletterData, $batchSize);
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT email, prenom, nom FROM newsletter_subscribers ORDER BY email ASC");
    $stmt->execute();
    $subscribers = $stmt->fetchAll();
    
} catch (Exception $e) {
    die("Erreur base de données: " . $e->getMessage());
}

// Diviser en lots
$batches = array_chunk($subscribers, $batchSize);

function generateEmailLinks($data, $batchSize) {
    global $batches;
    
    echo '<div class="generated-emails">';
    echo '<h2>📧 Tes ' . count($batches) . ' emails automatiques sont prêts !</h2>';
    
    foreach ($batches as $index => $batch) {
        $lotNumber = $index + 1;
        $emails = array_column($batch, 'email');
        $emailList = implode(',', $emails); // Virgules pour mailto
        
        $subject = urlencode($data['subject']);
        $body = generateEmailBody($data);
        $encodedBody = urlencode($body);
        
        // Créer le lien mailto avec BCC
        $mailtoLink = "mailto:?bcc=" . urlencode($emailList) . "&subject=" . $subject . "&body=" . $encodedBody;
        
        echo '<div class="email-batch-card">';
        echo '<div class="batch-header">';
        echo '<h3>📨 Email ' . $lotNumber . ' sur ' . count($batches) . '</h3>';
        echo '<span class="batch-count">' . count($emails) . ' destinataires</span>';
        echo '</div>';
        
        echo '<div class="batch-actions">';
        echo '<a href="' . htmlspecialchars($mailtoLink) . '" class="btn btn-primary btn-large">';
        echo '✉️ Ouvrir Email ' . $lotNumber . ' dans Outlook';
        echo '</a>';
        
        echo '<button class="btn btn-secondary" onclick="copyEmails(' . $index . ')">';
        echo '📋 Copier les emails';
        echo '</button>';
        echo '</div>';
        
        echo '<div class="email-preview">';
        echo '<strong>Destinataires :</strong><br>';
        echo '<div class="email-list" id="emails-' . $index . '">' . implode(', ', array_slice($emails, 0, 5));
        if (count($emails) > 5) echo '... et ' . (count($emails) - 5) . ' autres';
        echo '</div>';
        echo '<div class="full-email-list" id="full-emails-' . $index . '" style="display:none;">' . implode(', ', $emails) . '</div>';
        echo '</div>';
        
        echo '<div class="timing-info">';
        if ($lotNumber > 1) {
            $waitMinutes = ($lotNumber - 1) * 15;
            echo '⏰ Envoyer dans ' . $waitMinutes . ' minutes (après l\'email ' . ($lotNumber - 1) . ')';
        } else {
            echo '🚀 Envoyer maintenant';
        }
        echo '</div>';
        
        echo '</div>';
    }
    
    echo '<div class="instructions-final">';
    echo '<h3>📋 Mode d\'emploi :</h3>';
    echo '<ol>';
    echo '<li><strong>Clique "Ouvrir Email 1"</strong> → Outlook s\'ouvre avec tous les destinataires en BCC</li>';
    echo '<li><strong>Vérifie le contenu</strong> et envoie</li>';
    echo '<li><strong>Attends 15 minutes</strong> ⏰</li>';
    echo '<li><strong>Clique "Ouvrir Email 2"</strong> → Répète l\'opération</li>';
    echo '<li><strong>Continue</strong> jusqu\'au dernier email</li>';
    echo '</ol>';
    echo '<div class="warning-box">';
    echo '<strong>⚠️ Important :</strong> Respecte les 15 minutes entre chaque envoi pour éviter les blocages anti-spam !';
    echo '</div>';
    echo '</div>';
    
    echo '</div>';
}

function generateEmailBody($data) {
    $body = $data['intro'] . "\n\n";
    $body .= $data['content'] . "\n\n";
    
    if (!empty($data['ctaText']) && !empty($data['ctaLink'])) {
        $body .= "👉 " . $data['ctaText'] . ": " . $data['ctaLink'] . "\n\n";
    }
    
    $body .= "---\n";
    $body .= "Les Gloutonnes - Charles Bussers\n";
    $body .= "infos@lesgloutonnes.be | 0494 81 14 87\n";
    $body .= "www.lesgloutonnes.be\n\n";
    $body .= "📘 Facebook: https://facebook.com/gloutonnes\n";
    $body .= "📸 Instagram: https://instagram.com/lesgloutonnes.be\n";
    $body .= "🎥 YouTube: https://youtube.com/@lesgloutonnes\n\n";
    $body .= "Pour te désabonner: https://www.lesgloutonnes.be/pages/unsubscribe.php";
    
    return $body;
}

?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Générateur d'Emails Automatiques - Les Gloutonnes</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', Arial, sans-serif;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #5b0092 0%, #ff9100 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 30px;
        }
        
        .stats-box {
            background: #e7f3ff;
            border: 1px solid #b8daff;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #5b0092;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
        }
        
        .form-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        
        input, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus, textarea:focus {
            outline: none;
            border-color: #5b0092;
        }
        
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px 10px 10px 0;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            font-family: 'Poppins', Arial, sans-serif;
            font-size: 14px;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .btn-primary {
            background: #5b0092;
            color: white;
        }
        
        .btn-primary:hover {
            background: #4a0077;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .btn-large {
            padding: 15px 30px;
            font-size: 16px;
            font-weight: 600;
        }
        
        .generated-emails {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-top: 30px;
        }
        
        .generated-emails h2 {
            color: #5b0092;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .email-batch-card {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            transition: border-color 0.3s;
        }
        
        .email-batch-card:hover {
            border-color: #5b0092;
        }
        
        .batch-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .batch-header h3 {
            color: #5b0092;
            margin: 0;
        }
        
        .batch-count {
            background: #ff9100;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .batch-actions {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .email-preview {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .email-list {
            font-family: monospace;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .timing-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            color: #856404;
            text-align: center;
        }
        
        .instructions-final {
            background: white;
            border: 2px solid #5b0092;
            border-radius: 10px;
            padding: 25px;
            margin-top: 30px;
        }
        
        .instructions-final h3 {
            color: #5b0092;
            margin-bottom: 15px;
        }
        
        .instructions-final ol {
            margin-left: 20px;
            margin-bottom: 20px;
        }
        
        .instructions-final li {
            margin-bottom: 8px;
        }
        
        .warning-box {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            color: #721c24;
        }
        
        @media (max-width: 768px) {
            .batch-header {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
            
            .batch-header h3 {
                margin-bottom: 10px;
            }
            
            .batch-actions {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Générateur d'Emails Automatiques</h1>
            <p>Crée tes emails avec destinataires automatiquement répartis</p>
        </div>
        
        <div class="content">
            
            <!-- Statistiques -->
            <div class="stats-box">
                <h2>📊 Ta liste d'abonnés</h2>
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-number"><?php echo count($subscribers); ?></div>
                        <div class="stat-label">Total emails</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number"><?php echo count($batches); ?></div>
                        <div class="stat-label">Emails à créer</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number"><?php echo $batchSize; ?></div>
                        <div class="stat-label">Destinataires/email</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number"><?php echo (count($batches) - 1) * 15; ?> min</div>
                        <div class="stat-label">Temps d'attente total</div>
                    </div>
                </div>
            </div>
            
            <!-- Formulaire de newsletter -->
            <?php if ($action !== 'generate'): ?>
            <div class="form-section">
                <h2>✏️ Contenu de ta Newsletter</h2>
                <form method="POST">
                    <input type="hidden" name="action" value="generate">
                    
                    <div class="form-group">
                        <label for="subject">📧 Objet de l'email *</label>
                        <input type="text" id="subject" name="subject" required 
                               placeholder="Ex: Nouvelles plantes carnivores disponibles !">
                    </div>
                    
                    <div class="form-group">
                        <label for="title">🏷️ Titre principal *</label>
                        <input type="text" id="title" name="title" required 
                               placeholder="Ex: Découvre mes nouvelles créations">
                    </div>
                    
                    <div class="form-group">
                        <label for="intro">👋 Introduction *</label>
                        <textarea id="intro" name="intro" required 
                                  placeholder="Salut ! J'espère que tu vas bien et que tes plantes carnivores se portent à merveille..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="content">📝 Contenu principal *</label>
                        <textarea id="content" name="content" required style="min-height: 150px;"
                                  placeholder="Écris ici le contenu principal de ta newsletter..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="ctaText">🔗 Texte du bouton d'action</label>
                        <input type="text" id="ctaText" name="ctaText" 
                               value="Découvrir mes plantes"
                               placeholder="Ex: Découvrir la collection">
                    </div>
                    
                    <div class="form-group">
                        <label for="ctaLink">🌐 Lien du bouton d'action</label>
                        <input type="url" id="ctaLink" name="ctaLink" 
                               value="https://www.lesgloutonnes.be/pages/contact.html"
                               placeholder="https://www.lesgloutonnes.be/pages/contact.html">
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-large">
                        🚀 Générer mes <?php echo count($batches); ?> emails automatiques
                    </button>
                </form>
            </div>
            <?php endif; ?>
            
        </div>
    </div>

    <script>
        function copyEmails(batchIndex) {
            const emailList = document.getElementById('full-emails-' + batchIndex).textContent;
            
            navigator.clipboard.writeText(emailList).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ Copié !';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }).catch(() => {
                alert('Erreur lors de la copie. Sélectionnez le texte manuellement.');
            });
        }
    </script>
</body>
</html>