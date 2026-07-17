<?php
// /api/cancel-appointment.php - Système d'annulation/report avec invitation calendrier

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

// Fonction pour générer une ANNULATION calendrier (ICS)
function generateCancellationICS($appointment) {
    $name = $appointment['name'];
    $date = $appointment['date'];
    $time = $appointment['time'];
    
    // Créer les timestamps
    $start_datetime = new DateTime("$date $time", new DateTimeZone('Europe/Brussels'));
    $end_datetime = clone $start_datetime;
    $end_datetime->add(new DateInterval('PT90M'));
    
    $start_utc = $start_datetime->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z');
    $end_utc = $end_datetime->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z');
    $created = gmdate('Ymd\THis\Z');
    
    $uid = $appointment['id'] . '@lesgloutonnes.be';
    
    // ICS pour ANNULATION
    $ics_content = "BEGIN:VCALENDAR\r\n";
    $ics_content .= "VERSION:2.0\r\n";
    $ics_content .= "PRODID:-//Les Gloutonnes//Appointment System//FR\r\n";
    $ics_content .= "CALSCALE:GREGORIAN\r\n";
    $ics_content .= "METHOD:CANCEL\r\n"; // ← CANCEL au lieu de REQUEST
    $ics_content .= "BEGIN:VEVENT\r\n";
    $ics_content .= "UID:$uid\r\n";
    $ics_content .= "DTSTAMP:$created\r\n";
    $ics_content .= "DTSTART:$start_utc\r\n";
    $ics_content .= "DTEND:$end_utc\r\n";
    $ics_content .= "SUMMARY:ANNULÉ - Visite serre Les Gloutonnes - $name\r\n";
    $ics_content .= "DESCRIPTION:Ce rendez-vous a été annulé.\\n\\nNouveau contact recommandé pour reprogrammer.\r\n";
    $ics_content .= "STATUS:CANCELLED\r\n"; // ← Statut annulé
    $ics_content .= "ORGANIZER;CN=Charles Bussers:mailto:infos@lesgloutonnes.be\r\n";
    $ics_content .= "ATTENDEE;CN=$name:mailto:{$appointment['email']}\r\n";
    $ics_content .= "END:VEVENT\r\n";
    $ics_content .= "END:VCALENDAR\r\n";
    
    return $ics_content;
}

// Fonction pour envoyer email d'annulation avec ICS d'annulation
function sendCancellationEmail($appointment, $reason = '') {
    $to = sanitizeEmail($appointment['email']);
    if ($to === '') {
        return false;
    }

    $cc = sanitizeEmail(defined('MAIL_REPLY_TO_EMAIL') ? MAIL_REPLY_TO_EMAIL : 'infos@lesgloutonnes.be');
    $name = $appointment['name'];
    $date_fr = formatDateFr($appointment['date']);
    $time = $appointment['time'];
    
    $subject = sanitizeEmailSubject("❌ Rendez-vous reporté - Les Gloutonnes - $date_fr");
    
    $message = "
Bonjour $name,

Je suis désolé mais je dois reporter notre rendez-vous prévu le $date_fr à $time.

";
    
    if (!empty($reason)) {
        $message .= "Raison : $reason\n\n";
    }
    
    $message .= "=== ANNULATION AUTOMATIQUE ===
📅 L'événement sera automatiquement supprimé de ton calendrier grâce au fichier joint
🔄 Je vais te proposer de nouveaux créneaux très rapidement

=== NOUVEAUX CRÉNEAUX DISPONIBLES ===
Je te contacterai dans les plus brefs délais pour te proposer :
• D'autres créneaux cette semaine
• Des créneaux le week-end
• Ou selon tes préférences

=== CONTACT DIRECT POUR REPROGRAMMER ===
Tu peux aussi me contacter directement :
📞 Téléphone/SMS : +32 494 81 14 87
💬 WhatsApp : https://wa.me/+32494811487
✉️ Email : infos@lesgloutonnes.be

Encore désolé pour ce contretemps, j'ai hâte de te faire découvrir ma collection !

Charles - Les Gloutonnes 🌿

---
Les Gloutonnes - Collection de Plantes Carnivores
Voie des Jardinets 47B, 4537 Verlaine, Belgique
https://www.lesgloutonnes.be
";

    // Générer le fichier ICS d'annulation
    $ics_content = generateCancellationICS($appointment);
    $boundary = md5(time());
    
    // Headers
    $headers = [];
    $fromEmail = sanitizeEmail(defined('MAIL_REPLY_TO_EMAIL') ? MAIL_REPLY_TO_EMAIL : 'infos@lesgloutonnes.be');
    $fromName = defined('MAIL_REPLY_TO_NAME') ? MAIL_REPLY_TO_NAME : 'Charles - Les Gloutonnes';

    if ($fromEmail !== '') {
        $headers[] = 'From: ' . formatEmailAddress($fromEmail, $fromName);
        $headers[] = 'Reply-To: ' . formatEmailAddress($fromEmail, $fromName);
        ini_set('sendmail_from', $fromEmail);
    }

    if ($cc !== '' && $cc !== $to) {
        $headers[] = 'Cc: ' . formatEmailAddress($cc, defined('MAIL_REPLY_TO_NAME') ? MAIL_REPLY_TO_NAME : null);
    }

    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    
    // Corps avec pièce jointe
    $email_body = "--$boundary\r\n";
    $email_body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $email_body .= $message . "\r\n\r\n";
    
    // Pièce jointe ICS d'annulation
    $email_body .= "--$boundary\r\n";
    $email_body .= "Content-Type: text/calendar; method=CANCEL; name=\"annulation-rdv-gloutonnes.ics\"\r\n";
    $email_body .= "Content-Transfer-Encoding: base64\r\n";
    $email_body .= "Content-Disposition: attachment; filename=\"annulation-rdv-gloutonnes.ics\"\r\n\r\n";
    $email_body .= chunk_split(base64_encode($ics_content)) . "\r\n";
    $email_body .= "--$boundary--\r\n";
    
    configureMailTransport();
    $headerString = implode("\r\n", $headers);
    $sent = mail($to, $subject, $email_body, $headerString);

    if (defined('MAIL_LOG_FILE') && MAIL_LOG_FILE) {
        $status = $sent ? 'OK' : 'ERREUR';
        appendLog(MAIL_LOG_FILE, sprintf("[%s] %s | To: %s | Subject: %s%s", date('Y-m-d H:i:s'), $status, $to, $subject, PHP_EOL));
    }

    return $sent;
}

function formatDateFr($date) {
    $dateObj = new DateTime($date);
    $days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    $months = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
               'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
    $dayName = $days[$dateObj->format('w')];
    $day = $dateObj->format('j');
    $month = $months[(int)$dateObj->format('n')];
    $year = $dateObj->format('Y');
    
    return "$dayName $day $month $year";
}

// Script principal de gestion
$appointment_id = $_GET['id'] ?? '';
$action = $_GET['action'] ?? '';
$token = $_GET['token'] ?? '';

if (!isValidAppointmentId($appointment_id) || empty($token)) {
    die("Paramètres manquants");
}

$appointment = loadAppointment($appointment_id);
if (!$appointment) {
    die("Rendez-vous non trouvé");
}

if (empty($appointment['token']) || !hash_equals($appointment['token'], $token)) {
    die("Token invalide");
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Annuler/Reporter Rendez-vous - Les Gloutonnes</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .btn-cancel { background: #dc3545; color: white; }
        .btn-back { background: #6c757d; color: white; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; }
        textarea { width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🚫 Annuler/Reporter Rendez-vous</h1>
    
    <div class="card">
        <h2>Rendez-vous avec : <?= htmlspecialchars($appointment['name']) ?></h2>
        <p><strong>Date :</strong> <?= formatDateFr($appointment['date']) ?></p>
        <p><strong>Heure :</strong> <?= htmlspecialchars($appointment['time']) ?></p>
        <p><strong>Email :</strong> <?= htmlspecialchars($appointment['email']) ?></p>
        <p><strong>Statut actuel :</strong> <?= ucfirst($appointment['status']) ?></p>
    </div>

    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'cancel') {
        $reason = trim($_POST['cancel_reason'] ?? '');
        $new_slots = trim($_POST['new_slots'] ?? '');
        
        $full_message = $reason;
        if (!empty($new_slots)) {
            $full_message .= "\n\nNouveaux créneaux que je peux te proposer :\n" . $new_slots;
        }
        
        // Envoyer l'email d'annulation avec ICS
        if (sendCancellationEmail($appointment, $full_message)) {
            // Mettre à jour le statut
            $appointment['status'] = 'cancelled';
            $appointment['cancelled_at'] = date('Y-m-d H:i:s');
            $appointment['cancel_reason'] = $reason;
            saveAppointment($appointment);
            
            echo '<div class="success">✅ Rendez-vous annulé et email envoyé à ' . htmlspecialchars($appointment['email']) . '<br>';
            echo '📅 L\'événement sera automatiquement supprimé de son calendrier.</div>';
            echo '<p><a href="mailto:' . htmlspecialchars($appointment['email']) . '" class="btn btn-back">📧 Continuer la conversation par email</a></p>';
        } else {
            echo '<div class="error">❌ Erreur lors de l\'envoi de l\'email</div>';
        }
    } else {
        if ($appointment['status'] === 'confirmed') {
            echo '<div class="warning">⚠️ Ce rendez-vous est déjà confirmé. L\'annulation enverra automatiquement une mise à jour calendrier au visiteur.</div>';
        }
        
        echo '<form method="POST">';
        echo '<h3>Pourquoi annuler/reporter ce rendez-vous ?</h3>';
        echo '<textarea name="cancel_reason" placeholder="Ex: Je dois reporter car j\'ai un imprévu familial..." rows="3"></textarea>';
        
        echo '<h3>Nouveaux créneaux à proposer (optionnel) :</h3>';
        echo '<textarea name="new_slots" placeholder="Ex: 
- Samedi 15 juin de 10h à 12h
- Dimanche 16 juin de 14h à 16h  
- Mercredi 19 juin après 17h

Dis-moi ce qui t\'arrange le mieux !" rows="6"></textarea>';
        
        echo '<div>';
        echo '<button type="submit" class="btn btn-cancel">🚫 Annuler ce rendez-vous</button>';
        echo '<a href="javascript:history.back()" class="btn btn-back">← Retour</a>';
        echo '</div>';
        echo '</form>';
    }
    ?>
    
</body>
</html>